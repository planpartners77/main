"use client";

import { useState, type FocusEvent } from "react";
import { createClient } from "@/lib/supabase/client";

// 상태값(LeadStatusSelect)과 별개로, 담당자가 신청 건에 남기는 자유 텍스트 내부 메모.
// 고객에게는 노출되지 않는다 — blur 시점에만 저장해 타이핑마다 요청을 보내지 않는다.
export function LeadMemoField({ leadId, memo }: { leadId: string; memo: string | null }) {
  const [value, setValue] = useState(memo ?? "");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    if (next === (memo ?? "")) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").update({ admin_memo: next || null }).eq("id", leadId);
    setSaving(false);
    setSaved(!error);
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={handleBlur}
        placeholder="내부 메모"
        rows={2}
        className="w-40 resize-y rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-[var(--brand-blue)] focus:outline-none"
      />
      {saving && <p className="mt-0.5 text-[10px] text-gray-400">저장 중...</p>}
      {!saving && !saved && <p className="mt-0.5 text-[10px] text-red-400">저장 실패</p>}
    </div>
  );
}
