"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface TierOption {
  id: string;
  name: string | null;
}

const ACCESSED_FIELDS = ["display_name", "phone", "tier_id", "marketing_opt_in", "referral_role"];

export function MemberEditForm({
  memberId,
  actorId,
  email,
  initialDisplayName,
  initialPhone,
  initialTierId,
  initialMarketingOptIn,
  initialReferralRole,
  tierOptions,
}: {
  memberId: string;
  actorId: string;
  email: string | null;
  initialDisplayName: string;
  initialPhone: string;
  initialTierId: string;
  initialMarketingOptIn: boolean;
  initialReferralRole: "member" | "partner";
  tierOptions: TierOption[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [tierId, setTierId] = useState(initialTierId);
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [referralRole, setReferralRole] = useState(initialReferralRole);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

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
        referral_role: referralRole,
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

  async function handleSendResetEmail() {
    if (!email) return;
    setResetSending(true);
    setResetError(null);
    setResetMessage(null);

    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetErr) {
      setResetSending(false);
      setResetError(resetErr.message);
      return;
    }

    // §9-1 개인정보 처리 로그: 실제 비밀번호는 다루지 않지만, 관리자가 재설정 메일
    // 발송을 트리거한 사실 자체를 별도 action으로 남긴다.
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action: "password_reset_request",
      target_table: "auth.users",
      target_id: memberId,
      accessed_fields: ["email"],
    });

    setResetSending(false);
    setResetMessage(`${email}로 재설정 메일을 발송했습니다.`);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">회원 정보 수정 (관리자)</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-gray-500">이메일</label>
          <input
            value={email ?? "-"}
            disabled
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>
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
          <label className="text-xs text-gray-500">구분</label>
          <select
            value={referralRole}
            onChange={(e) => setReferralRole(e.target.value as "member" | "partner")}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="member">일반회원</option>
            <option value="partner">파트너</option>
          </select>
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

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-600">비밀번호 관리</p>
        <p className="mt-1 text-xs text-gray-400">
          관리자가 직접 비밀번호를 지정할 수는 없으며, 회원 본인 이메일로 재설정 링크를 보냅니다.
        </p>

        {resetError && <p className="mt-2 text-xs text-red-600">{resetError}</p>}
        {resetMessage && !resetError && <p className="mt-2 text-xs text-green-600">{resetMessage}</p>}

        <button
          type="button"
          onClick={handleSendResetEmail}
          disabled={resetSending || !email}
          className="mt-3 rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
        >
          {resetSending ? "발송 중..." : "비밀번호 재설정 메일 발송"}
        </button>
      </div>
    </div>
  );
}
