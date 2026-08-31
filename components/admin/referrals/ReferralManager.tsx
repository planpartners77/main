"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface ReferralCodeRow {
  id: string;
  code: string;
  name: string | null;
  type: "partner" | "member" | null;
  parent_code_id: string | null;
  root_code_id: string | null;
  depth: number;
  total_clicks: number;
  total_registrations: number;
  is_active: boolean;
  expires_at: string | null;
}

const EMPTY_FORM = {
  code: "",
  name: "",
  type: "partner" as "partner" | "member",
  parent_code_id: "",
  is_active: true,
  expires_at: "",
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatus(row: ReferralCodeRow): "active" | "inactive" | "expired" {
  if (row.expires_at && new Date(row.expires_at) < new Date()) return "expired";
  if (!row.is_active) return "inactive";
  return "active";
}

const STATUS_LABEL: Record<string, string> = { active: "활성", inactive: "비활성", expired: "만료" };
const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  expired: "bg-red-50 text-red-600",
};

export function ReferralManager({ codes }: { codes: ReferralCodeRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(row: ReferralCodeRow) {
    setForm({
      code: row.code,
      name: row.name ?? "",
      type: row.type ?? "partner",
      parent_code_id: row.parent_code_id ?? "",
      is_active: row.is_active,
      expires_at: toDatetimeLocal(row.expires_at),
    });
    setEditingId(row.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.code.trim()) {
      setError("코드는 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : null;

    if (editingId) {
      const { error: saveError } = await supabase
        .from("referral_codes")
        .update({ name: form.name.trim() || null, type: form.type, is_active: form.is_active, expires_at: expiresAt })
        .eq("id", editingId);
      setSaving(false);
      if (saveError) {
        setError(`저장 실패: ${saveError.message}`);
        return;
      }
      setShowForm(false);
      router.refresh();
      return;
    }

    const parent = codes.find((c) => c.id === form.parent_code_id) ?? null;
    const { data: inserted, error: insertError } = await supabase
      .from("referral_codes")
      .insert({
        code: form.code.trim(),
        name: form.name.trim() || null,
        type: form.type,
        parent_code_id: parent?.id ?? null,
        root_code_id: parent?.root_code_id ?? null,
        depth: parent ? parent.depth + 1 : 0,
        is_active: form.is_active,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (!insertError && !parent && inserted) {
      await supabase.from("referral_codes").update({ root_code_id: inserted.id }).eq("id", inserted.id);
    }

    setSaving(false);
    if (insertError) {
      setError(`저장 실패: ${insertError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(row: ReferralCodeRow) {
    if (!confirm(`"${row.code}" 코드를 삭제할까요?`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("referral_codes").delete().eq("id", row.id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message} (하위 코드가 연결되어 있으면 먼저 정리해야 합니다.)`);
      return;
    }
    router.refresh();
  }

  async function toggleActive(row: ReferralCodeRow) {
    const supabase = createClient();
    await supabase.from("referral_codes").update({ is_active: !row.is_active }).eq("id", row.id);
    router.refresh();
  }

  function copyLink(row: ReferralCodeRow) {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(row.code)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 1500);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          코드에 상위 코드를 지정하면 다단계 추천 트리로 연결됩니다. 클릭수·전환수는 실제 유입 발생 시 자동 집계됩니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 코드 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            코드
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={!!editingId}
              placeholder="예: PARTNER001"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </label>
          <label className="text-sm">
            이름 (선택)
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            유형
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "partner" | "member" })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="partner">파트너</option>
              <option value="member">회원</option>
            </select>
          </label>
          <label className="text-sm">
            상위 코드 (선택)
            <select
              value={form.parent_code_id}
              onChange={(e) => setForm({ ...form, parent_code_id: e.target.value })}
              disabled={!!editingId}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">최상위(부모 없음)</option>
              {codes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                  {c.name ? ` (${c.name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            활성화
          </label>
          <label className="text-sm">
            만료일시 (선택)
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : editingId ? "수정 저장" : "등록"}
            </button>
          </div>
        </form>
      )}

      {codes.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 추천인 코드가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">코드</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">상위코드</th>
                <th className="px-4 py-3">뎁스</th>
                <th className="px-4 py-3">클릭</th>
                <th className="px-4 py-3">전환</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => {
                const status = getStatus(row);
                const parent = codes.find((c) => c.id === row.parent_code_id);
                return (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3 text-gray-500">{row.name ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{row.type === "member" ? "회원" : "파트너"}</td>
                    <td className="px-4 py-3 text-gray-500">{parent?.code ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{row.depth}</td>
                    <td className="px-4 py-3 text-gray-500">{row.total_clicks}</td>
                    <td className="px-4 py-3 text-gray-500">{row.total_registrations}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(row)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-semibold">
                        <button onClick={() => copyLink(row)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          {copiedId === row.id ? "복사됨" : "링크복사"}
                        </button>
                        <button onClick={() => startEdit(row)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          수정
                        </button>
                        <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
