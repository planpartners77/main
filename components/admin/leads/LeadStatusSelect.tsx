"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";

export function LeadStatusSelect({
  leadId,
  status,
  referralCodeId,
}: {
  leadId: string;
  status: string;
  referralCodeId?: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  // 이 사이트는 결제/구매 단계가 사이트 밖(제휴사)에서 일어나 별도 결제 이벤트가 없다 —
  // 관리자가 리드 상태를 "완료"로 바꾸는 시점이 실제 가입 확정에 가장 가까운 전환 시점이므로,
  // 추천코드가 붙어 있으면 여기서 referral_conversions에 최종 전환을 기록한다(중복 방지를 위해
  // 동일 lead_id+conversion_type 기록이 있는지 먼저 확인).
  async function recordCompletionConversion(supabase: ReturnType<typeof createClient>) {
    if (!referralCodeId) return;

    const { data: existing } = await supabase
      .from("referral_conversions")
      .select("id")
      .eq("lead_id", leadId)
      .eq("conversion_type", "completed")
      .maybeSingle();
    if (existing) return;

    const { data: referral } = await supabase
      .from("referral_codes")
      .select("id, root_code_id, depth")
      .eq("id", referralCodeId)
      .maybeSingle();
    if (!referral) return;

    await supabase.from("referral_conversions").insert({
      code_id: referral.id,
      root_code_id: referral.root_code_id,
      lead_id: leadId,
      conversion_type: "completed",
      depth: referral.depth,
    });
  }

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const prev = value;
    setValue(next);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("leads").update({ status: next }).eq("id", leadId);

    if (!error && next === "completed") {
      await recordCompletionConversion(supabase);
    }

    setSaving(false);
    if (error) {
      setValue(prev);
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
    >
      {LEAD_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
