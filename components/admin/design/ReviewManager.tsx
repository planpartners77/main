"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface ReviewRow {
  id: string;
  category_id: string | null;
  author_label: string;
  rating: number | null;
  body: string;
  is_active: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
}

const EMPTY_FORM = { category_id: "", author_label: "", rating: "5", body: "" };

export function ReviewManager({ reviews, categories }: { reviews: ReviewRow[]; categories: CategoryOption[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.category_id || !form.author_label.trim() || !form.body.trim()) {
      setError("카테고리, 작성자 표시명, 내용은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveError } = await supabase.from("reviews").insert({
      category_id: form.category_id,
      author_label: form.author_label.trim(),
      rating: Number(form.rating) || null,
      body: form.body.trim(),
      is_active: false,
    });
    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 후기를 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("reviews").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(review: ReviewRow) {
    const supabase = createClient();
    await supabase.from("reviews").update({ is_active: !review.is_active }).eq("id", review.id);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        실제로 접수된 후기만 등록하세요. 새로 등록한 후기는 기본적으로 비공개(승인 대기) 상태입니다 — 검수 후
        &ldquo;게시&rdquo;로 전환하면 홈 화면에 노출됩니다.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "후기 등록"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
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
            평점
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            작성자 표시명 (예: &ldquo;30대 자취생&rdquo;, 익명 처리)
            <input
              value={form.author_label}
              onChange={(e) => setForm({ ...form, author_label: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            내용
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
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
              {saving ? "저장 중..." : "등록 (비공개)"}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 후기가 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{review.author_label}</span>
                  {review.rating && <span className="text-xs text-amber-500">{"★".repeat(review.rating)}</span>}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      review.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {review.is_active ? "게시중" : "승인 대기"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{review.body}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => toggleActive(review)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  {review.is_active ? "숨기기" : "게시"}
                </button>
                <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-700">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
