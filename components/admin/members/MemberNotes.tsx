"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface MemberNoteRow {
  id: number;
  content: string;
  created_at: string;
  adminName: string | null;
}

export function MemberNotes({
  memberId,
  actorId,
  notes,
}: {
  memberId: string;
  actorId: string;
  notes: MemberNoteRow[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("member_notes").insert({
      profile_id: memberId,
      admin_id: actorId,
      content: content.trim(),
    });

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    setSaving(false);
    setContent("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">CS 메모</p>
      <div className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="상담 내용, 요청사항 등을 기록하세요"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          추가
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto border-t border-gray-100 pt-3 text-sm">
        {notes.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">등록된 메모가 없습니다.</p>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-gray-50 p-2.5">
              <p className="text-gray-700">{n.content}</p>
              <p className="mt-1 text-[11px] text-gray-400">
                {n.adminName ?? "관리자"} · {new Date(n.created_at).toLocaleString("ko-KR")}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
