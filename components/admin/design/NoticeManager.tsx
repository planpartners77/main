"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface NoticeRow {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string;
}

const EMPTY_FORM = { title: "", body: "", is_pinned: false, is_active: true };

export function NoticeManager({ notices }: { notices: NoticeRow[] }) {
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

  function startEdit(notice: NoticeRow) {
    setForm({ title: notice.title, body: notice.body, is_pinned: notice.is_pinned, is_active: notice.is_active });
    setEditingId(notice.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("제목과 내용은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { title: form.title.trim(), body: form.body.trim(), is_pinned: form.is_pinned, is_active: form.is_active };
    const { error: saveError } = editingId
      ? await supabase.from("notices").update(payload).eq("id", editingId)
      : await supabase.from("notices").insert(payload);
    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 공지사항을 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("notices").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(notice: NoticeRow) {
    const supabase = createClient();
    await supabase.from("notices").update({ is_active: !notice.is_active }).eq("id", notice.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">고정 공지는 목록 상단에 항상 노출됩니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 공지 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5">
          <label className="text-sm">
            제목
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            내용
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
              상단 고정
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              게시함
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
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

      {notices.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 공지사항이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {notices.map((notice) => (
            <div key={notice.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  {notice.is_pinned && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">고정</span>
                  )}
                  <span className={`text-sm font-medium ${notice.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                    {notice.title}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{new Date(notice.published_at).toLocaleDateString("ko-KR")}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => toggleActive(notice)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  {notice.is_active ? "숨기기" : "게시"}
                </button>
                <button onClick={() => startEdit(notice)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  수정
                </button>
                <button onClick={() => handleDelete(notice.id)} className="text-red-500 hover:text-red-700">
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
