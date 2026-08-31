"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface PartnerRow {
  id: string;
  category_id: string | null;
  name: string;
  biz_reg_no: string | null;
  settlement_rate: number | null;
  contract_status: string;
  logo_url: string | null;
  categories: { name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  category_id: "",
  name: "",
  biz_reg_no: "",
  settlement_rate: "",
  contract_status: "active",
  logo_url: "",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "계약중",
  paused: "일시중지",
  terminated: "해지",
};
const CONTRACT_STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  paused: "bg-amber-50 text-amber-700",
  terminated: "bg-gray-100 text-gray-500",
};

export function PartnerManager({ partners, categories }: { partners: PartnerRow[]; categories: CategoryOption[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(partner: PartnerRow) {
    setForm({
      category_id: partner.category_id ?? "",
      name: partner.name,
      biz_reg_no: partner.biz_reg_no ?? "",
      settlement_rate: partner.settlement_rate != null ? String(partner.settlement_rate) : "",
      contract_status: partner.contract_status,
      logo_url: partner.logo_url ?? "",
    });
    setEditingId(partner.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.category_id) {
      setError("카테고리와 파트너명은 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      category_id: form.category_id,
      name: form.name.trim(),
      biz_reg_no: form.biz_reg_no.trim() || null,
      settlement_rate: form.settlement_rate ? Number(form.settlement_rate) : null,
      contract_status: form.contract_status,
      logo_url: form.logo_url.trim() || null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("partners").update(payload).eq("id", editingId)
      : await supabase.from("partners").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(partner: PartnerRow) {
    if (!confirm(`"${partner.name}" 파트너를 삭제할까요?`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("partners").delete().eq("id", partner.id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message} (연결된 상품이 있으면 먼저 정리해야 합니다.)`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">카테고리별 제휴 파트너와 정산 조건을 관리합니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 파트너 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            카테고리
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            파트너명
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            사업자등록번호 (선택)
            <input
              value={form.biz_reg_no}
              onChange={(e) => setForm({ ...form, biz_reg_no: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            정산 수수료율(%) (선택)
            <input
              type="number"
              step="0.01"
              value={form.settlement_rate}
              onChange={(e) => setForm({ ...form, settlement_rate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            계약 상태
            <select
              value={form.contract_status}
              onChange={(e) => setForm({ ...form, contract_status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="active">계약중</option>
              <option value="paused">일시중지</option>
              <option value="terminated">해지</option>
            </select>
          </label>
          <label className="text-sm">
            로고 URL (선택)
            <input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://..."
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

      {partners.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 파트너가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">로고</th>
                <th className="px-4 py-3">파트너명</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">사업자번호</th>
                <th className="px-4 py-3">정산율</th>
                <th className="px-4 py-3">계약상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    {partner.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 로고, next/image 미사용 컨벤션
                      <img src={partner.logo_url} alt={partner.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{partner.name}</td>
                  <td className="px-4 py-3 text-gray-500">{partner.categories?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{partner.biz_reg_no ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {partner.settlement_rate != null ? `${partner.settlement_rate}%` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONTRACT_STATUS_STYLE[partner.contract_status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {CONTRACT_STATUS_LABEL[partner.contract_status] ?? partner.contract_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      <button onClick={() => startEdit(partner)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                        수정
                      </button>
                      <button onClick={() => handleDelete(partner)} className="text-red-500 hover:text-red-700">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
