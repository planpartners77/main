"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral, getStoredUtm } from "@/lib/referral/client";
import { PHONE_ACTIVATION_TYPES, PHONE_CARRIERS } from "@/lib/mobile/device-spec";

const RE_PHONE = /^010-\d{4}-\d{4}$/;

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface DeviceOption {
  id: string;
  title: string;
  partnerName: string | null;
}

export function PhoneApplyForm({ initialDeviceId }: { initialDeviceId: string | null }) {
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [deviceId, setDeviceId] = useState(initialDeviceId ?? "");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [activationType, setActivationType] = useState<(typeof PHONE_ACTIVATION_TYPES)[number]>("번호이동");
  const [carrier, setCarrier] = useState<(typeof PHONE_CARRIERS)[number]>("SKT");
  const [preferredDate, setPreferredDate] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "mobile").maybeSingle();
      if (!category) return;
      const { data } = await supabase
        .from("products")
        .select("id, title, partners(name)")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("title");
      setDevices(
        (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          partnerName: (p.partners as unknown as { name: string } | null)?.name ?? null,
        })),
      );
    })();
  }, []);

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!deviceId) next.deviceId = "기종을 선택해 주세요.";
    if (!name.trim()) next.name = "신청자 이름을 입력해 주세요.";
    if (!/^\d{6,8}$/.test(birthDate.replace(/\D/g, ""))) next.birthDate = "생년월일을 확인해 주세요.";
    if (!RE_PHONE.test(phone)) next.phone = "010-0000-0000 형식으로 입력해 주세요.";
    if (!preferredDate) next.preferredDate = "희망 개통일을 선택해 주세요.";
    if (!consentTerms) next.consentTerms = "서비스 이용약관 동의가 필요합니다.";
    if (!consentPrivacy) next.consentPrivacy = "개인정보 수집·이용 동의가 필요합니다.";
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "mobile").maybeSingle();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const leadId = crypto.randomUUID();
      const referral = getStoredReferral();
      const utm = getStoredUtm();

      const { error } = await supabase.from("leads").insert({
        id: leadId,
        category_id: category?.id ?? null,
        product_id: deviceId,
        user_id: user?.id ?? null,
        status: "received",
        referral_code_id: referral?.codeId ?? null,
        guest_contact: {
          name,
          birthDate,
          phone,
          activationType,
          carrier,
          preferredDate,
        },
        consent: { terms: consentTerms, privacy: consentPrivacy, marketing: consentMarketing },
        referrer_url: typeof window !== "undefined" ? window.location.href : null,
        utm_source: utm?.utm_source ?? null,
        utm_medium: utm?.utm_medium ?? null,
        utm_campaign: utm?.utm_campaign ?? null,
      });
      if (error) throw error;

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mobile_lead", id: leadId }),
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
      setSubmitError("신청서 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-mint)]/15 text-2xl text-[var(--brand-mint)]">
          ✓
        </div>
        <p className="mt-4 text-base font-bold text-[var(--brand-navy)]">신청서가 접수되었습니다</p>
        <p className="mt-2 text-sm text-gray-500">남겨주신 연락처로 담당자가 확인 후 개통 절차를 안내드리겠습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">1. 기종 선택 *</label>
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        >
          <option value="">선택해 주세요</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.partnerName ? `[${d.partnerName}] ` : ""}
              {d.title}
            </option>
          ))}
        </select>
        {errors.deviceId && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.deviceId}</p>}
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">2. 개통 방식 *</label>
        <div className="mt-2 flex flex-wrap gap-4">
          {PHONE_ACTIVATION_TYPES.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="activationType"
                checked={activationType === opt}
                onChange={() => setActivationType(opt)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">3. 통신사 *</label>
        <div className="mt-2 flex flex-wrap gap-4">
          {PHONE_CARRIERS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="carrier"
                checked={carrier === opt}
                onChange={() => setCarrier(opt)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">4. 신청자 이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        {errors.name && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">5. 생년월일 *</label>
        <input
          type="text"
          placeholder="예: 19900101"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        {errors.birthDate && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.birthDate}</p>}
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">6. 연락처 *</label>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        {errors.phone && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.phone}</p>}
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">7. 희망 개통일 *</label>
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        {errors.preferredDate && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.preferredDate}</p>}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={consentTerms}
            onChange={(e) => setConsentTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
          />
          (필수) 서비스 이용약관에 동의합니다
        </label>
        {errors.consentTerms && <p className="text-xs font-medium text-[var(--brand-urgent)]">{errors.consentTerms}</p>}
        <label className="flex items-start gap-2.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={consentPrivacy}
            onChange={(e) => setConsentPrivacy(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
          />
          (필수) 개인정보 수집·이용에 동의합니다
        </label>
        {errors.consentPrivacy && <p className="text-xs font-medium text-[var(--brand-urgent)]">{errors.consentPrivacy}</p>}
        <label className="flex items-start gap-2.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
          />
          (선택) 마케팅 정보 수신에 동의합니다
        </label>
      </div>

      {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-[var(--brand-urgent)]">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60"
      >
        {submitting ? "제출 중..." : "신청서 제출하기"}
      </button>
    </form>
  );
}
