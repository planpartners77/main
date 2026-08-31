"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral } from "@/lib/referral/client";

const PREFERRED_TIME_OPTIONS = ["평일 오전", "평일 오후", "저녁(18시 이후)", "주말"] as const;

const RE_PHONE = /^01[0-9]-\d{3,4}-\d{4}$/;

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function ConsultRequestForm({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState<string>(PREFERRED_TIME_OPTIONS[0]);
  const [memo, setMemo] = useState("");
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentThirdParty, setConsentThirdParty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "이름을 입력해 주세요.";
    if (!RE_PHONE.test(phone)) next.phone = "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)";
    if (!consentPrivacy) next.consentPrivacy = "개인정보 수집·이용 동의가 필요합니다.";
    if (!consentThirdParty) next.consentThirdParty = "제휴사 상담 연계를 위한 정보제공 동의가 필요합니다.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      const leadId = crypto.randomUUID();
      const referral = getStoredReferral();

      const { error } = await supabase.from("leads").insert({
        id: leadId,
        category_id: category?.id ?? null,
        status: "received",
        referral_code_id: referral?.codeId ?? null,
        guest_contact: {
          name: name.trim(),
          phone,
          preferredTime,
          memo: memo.trim() || null,
          channel: "online_consult",
        },
        consent: {
          privacy: consentPrivacy,
          thirdParty: consentThirdParty,
        },
        referrer_url: typeof window !== "undefined" ? window.location.href : null,
      });

      if (error) throw error;

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "consult_lead", id: leadId }),
      }).catch(() => {});

      if (referral) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "convert", leadId, codeId: referral.codeId }),
        }).catch(() => {});
      }

      setSubmitted(true);
    } catch {
      setSubmitError("상담 신청 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-lg font-bold text-[var(--brand-navy)]">상담 신청이 접수되었습니다.</p>
        <p className="mt-2 text-sm text-gray-600">
          담당 상담사가 배정되어 남겨주신 연락처로 순차 연락드립니다. 가입이 확정되는 경우 청약철회 절차도 함께
          안내해 드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{categoryName} 무료 상담 신청</p>
      <p className="mt-1 text-xs text-gray-500">셀프가입이 아닌 상담 예약 신청입니다. 즉시 결제·가입은 진행되지 않습니다.</p>

      <div className="mt-4 grid gap-3">
        <div>
          <label className="text-xs text-gray-500">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500">연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-1234-5678"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500">상담 희망 시간대</label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {PREFERRED_TIME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">문의 내용(선택)</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={consentPrivacy}
            onChange={(e) => setConsentPrivacy(e.target.checked)}
          />
          (필수) 상담을 위한 개인정보 수집·이용에 동의합니다.
        </label>
        {errors.consentPrivacy && <p className="text-xs text-red-600">{errors.consentPrivacy}</p>}
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={consentThirdParty}
            onChange={(e) => setConsentThirdParty(e.target.checked)}
          />
          (필수) 상담 연계를 위해 제휴 상담사에게 정보가 제공됨에 동의합니다.
        </label>
        {errors.consentThirdParty && <p className="text-xs text-red-600">{errors.consentThirdParty}</p>}
      </div>

      {submitError && <p className="mt-3 text-xs text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-full bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
      >
        {submitting ? "접수 중..." : "무료 상담 예약하기"}
      </button>
    </form>
  );
}
