"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface EventRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
}

const EMPTY_FORM = { title: "", body: "", image_url: "", start_at: "", end_at: "", is_active: true };

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventManager({ events }: { events: EventRow[] }) {
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

  function startEdit(ev: EventRow) {
    setForm({
      title: ev.title,
      body: ev.body,
      image_url: ev.image_url ?? "",
      start_at: toDatetimeLocal(ev.start_at),
      end_at: toDatetimeLocal(ev.end_at),
      is_active: ev.is_active,
    });
    setEditingId(ev.id);
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
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      image_url: form.image_url.trim() || null,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      is_active: form.is_active,
    };
    const { error: saveError } = editingId
      ? await supabase.from("events").update(payload).eq("id", editingId)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 이벤트를 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(ev: EventRow) {
    const supabase = createClient();
    await supabase.from("events").update({ is_active: !ev.is_active }).eq("id", ev.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">기간을 비워두면 상시 노출됩니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 이벤트 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            제목
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            내용
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            이미지 URL (선택)
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="이미지 탭에서 업로드 후 URL 복사"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            시작 (선택)
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            종료 (선택)
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            게시함
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

      {events.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 이벤트가 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <span className={`text-sm font-medium ${ev.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                  {ev.title}
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  {ev.start_at ? new Date(ev.start_at).toLocaleDateString("ko-KR") : "상시"}
                  {ev.end_at ? ` ~ ${new Date(ev.end_at).toLocaleDateString("ko-KR")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => toggleActive(ev)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  {ev.is_active ? "숨기기" : "게시"}
                </button>
                <button onClick={() => startEdit(ev)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  수정
                </button>
                <button onClick={() => handleDelete(ev.id)} className="text-red-500 hover:text-red-700">
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
