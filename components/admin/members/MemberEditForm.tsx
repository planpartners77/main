"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface TierOption {
  id: string;
  name: string | null;
}

const ACCESSED_FIELDS = ["display_name", "phone", "tier_id", "marketing_opt_in"];

export function MemberEditForm({
  memberId,
  actorId,
  initialDisplayName,
  initialPhone,
  initialTierId,
  initialMarketingOptIn,
  tierOptions,
}: {
  memberId: string;
  actorId: string;
  initialDisplayName: string;
  initialPhone: string;
  initialTierId: string;
  initialMarketingOptIn: boolean;
  tierOptions: TierOption[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [tierId, setTierId] = useState(initialTierId);
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        tier_id: tierId || null,
        marketing_opt_in: marketingOptIn,
      })
      .eq("id", memberId);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    // §9-1 개인정보 처리 로그: 조회뿐 아니라 관리자의 수정 행위도 별도 action으로 남긴다.
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action: "update",
      target_table: "profiles",
      target_id: memberId,
      accessed_fields: ACCESSED_FIELDS,
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">회원 정보 수정 (관리자)</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-gray-500">이름</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">등급</label>
          <select
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">일반(등급 없음)</option>
            {tierOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name ?? "이름 없음"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        마케팅 정보 수신 동의
      </label>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs text-green-600">저장되었습니다.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-[var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
