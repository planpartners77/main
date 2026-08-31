"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getExposureStatus, EXPOSURE_STATUS_LABEL, EXPOSURE_STATUS_STYLE } from "@/lib/design/exposure-status";

export interface PopupRow {
  id: string;
  title: string;
  image_url: string | null;
  body: string | null;
  link_url: string | null;
  display_type: "layer" | "bottom_bar";
  sort_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

const EMPTY_FORM = {
  title: "",
  image_url: "",
  body: "",
  link_url: "",
  display_type: "layer" as "layer" | "bottom_bar",
  sort_order: "0",
  is_active: true,
  start_at: "",
  end_at: "",
};

const DISPLAY_TYPE_LABEL: Record<PopupRow["display_type"], string> = {
  layer: "레이어(중앙 팝업)",
  bottom_bar: "하단 바",
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PopupManager({ popups }: { popups: PopupRow[] }) {
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

  function startEdit(popup: PopupRow) {
    setForm({
      title: popup.title,
      image_url: popup.image_url ?? "",
      body: popup.body ?? "",
      link_url: popup.link_url ?? "",
      display_type: popup.display_type,
      sort_order: String(popup.sort_order),
      is_active: popup.is_active,
      start_at: toDatetimeLocal(popup.start_at),
      end_at: toDatetimeLocal(popup.end_at),
    });
    setEditingId(popup.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("제목은 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      image_url: form.image_url.trim() || null,
      body: form.body.trim() || null,
      link_url: form.link_url.trim() || null,
      display_type: form.display_type,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("popups").update(payload).eq("id", editingId)
      : await supabase.from("popups").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 팝업을 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("popups").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(popup: PopupRow) {
    const supabase = createClient();
    await supabase.from("popups").update({ is_active: !popup.is_active }).eq("id", popup.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">사이트 전체에 노출됩니다. 사용자가 &ldquo;오늘 하루 보지 않기&rdquo;를 선택하면 당일 자정까지 숨겨집니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 팝업 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            제목
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            표시 형태
            <select
              value={form.display_type}
              onChange={(e) => setForm({ ...form, display_type: e.target.value as "layer" | "bottom_bar" })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="layer">레이어(중앙 팝업)</option>
              <option value="bottom_bar">하단 바</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            이미지 URL (선택, 레이어형에만 표시됨)
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="이미지 탭에서 업로드 후 URL 복사"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            본문 (선택)
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            링크 URL (선택)
            <input
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            순서
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
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
            노출 시작 (선택)
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            노출 종료 (선택)
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
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

      {popups.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 팝업이 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">형태</th>
                <th className="px-4 py-3">순서</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {popups.map((popup) => {
                const status = getExposureStatus(popup);
                return (
                  <tr key={popup.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium">{popup.title}</td>
                    <td className="px-4 py-3 text-gray-500">{DISPLAY_TYPE_LABEL[popup.display_type]}</td>
                    <td className="px-4 py-3 text-gray-500">{popup.sort_order}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(popup)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${EXPOSURE_STATUS_STYLE[status]}`}
                      >
                        {EXPOSURE_STATUS_LABEL[status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-semibold">
                        <button onClick={() => startEdit(popup)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          수정
                        </button>
                        <button onClick={() => handleDelete(popup.id)} className="text-red-500 hover:text-red-700">
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
