"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getExposureStatus, EXPOSURE_STATUS_LABEL, EXPOSURE_STATUS_STYLE } from "@/lib/design/exposure-status";

export interface BannerRow {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  category_id: string | null;
  sort_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  title: "",
  image_url: "",
  link_url: "",
  category_id: "",
  sort_order: "0",
  is_active: true,
  start_at: "",
  end_at: "",
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BannerManager({ banners, categories }: { banners: BannerRow[]; categories: CategoryOption[] }) {
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

  function startEdit(banner: BannerRow) {
    setForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url ?? "",
      category_id: banner.category_id ?? "",
      sort_order: String(banner.sort_order),
      is_active: banner.is_active,
      start_at: toDatetimeLocal(banner.start_at),
      end_at: toDatetimeLocal(banner.end_at),
    });
    setEditingId(banner.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      setError("제목과 이미지 URL은 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      category_id: form.category_id || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("banners").update(payload).eq("id", editingId)
      : await supabase.from("banners").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 배너를 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(banner: BannerRow) {
    const supabase = createClient();
    await supabase.from("banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">노출 대상(전체/카테고리)별로 등록하고, 순서가 작을수록 먼저 표시됩니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 배너 추가"}
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
            이미지 URL
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="이미지 탭에서 업로드 후 URL 복사"
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
            노출 대상
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">전체(홈 화면)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} 페이지
                </option>
              ))}
            </select>
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

      {banners.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 배너가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">이미지</th>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">노출 대상</th>
                <th className="px-4 py-3">순서</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => {
                const status = getExposureStatus(banner);
                return (
                  <tr key={banner.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션 */}
                      <img src={banner.image_url} alt={banner.title} className="h-10 w-16 rounded-lg object-cover" />
                    </td>
                    <td className="px-4 py-3 font-medium">{banner.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {categories.find((c) => c.id === banner.category_id)?.name ?? "전체(홈)"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{banner.sort_order}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(banner)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${EXPOSURE_STATUS_STYLE[status]}`}
                      >
                        {EXPOSURE_STATUS_LABEL[status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-semibold">
                        <button onClick={() => startEdit(banner)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          수정
                        </button>
                        <button onClick={() => handleDelete(banner.id)} className="text-red-500 hover:text-red-700">
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
