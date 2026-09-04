"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OPTIONS: { value: "active" | "suspended" | "withdrawn"; label: string }[] = [
  { value: "active", label: "정상" },
  { value: "suspended", label: "정지" },
  { value: "withdrawn", label: "탈퇴" },
];

export function MemberStatusControl({
  memberId,
  actorId,
  initialStatus,
}: {
  memberId: string;
  actorId: string;
  initialStatus: "active" | "suspended" | "withdrawn";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ status }).eq("id", memberId);

    if (error) {
      setSaving(false);
      setMessage(`실패: ${error.message}`);
      return;
    }

    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action: "status_change",
      target_table: "profiles",
      target_id: memberId,
      accessed_fields: ["status"],
    });

    setSaving(false);
    setMessage("변경되었습니다. 정지/탈퇴 회원은 다음 접속 시 자동 로그아웃됩니다.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">계정 상태</p>
      <div className="mt-3 flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || status === initialStatus}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
    </div>
  );
}
