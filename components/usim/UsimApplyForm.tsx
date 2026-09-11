"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral, getStoredUtm } from "@/lib/referral/client";

const RE_PHONE = /^010-\d{4}-\d{4}$/;

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const ACTIVATION_TYPES = [
  { value: "new", label: "신규가입" },
  { value: "port", label: "번호이동" },
  { value: "device_change", label: "기기변경" },
] as const;

const SIM_TYPE_OPTIONS = [
  { value: "usim", label: "유심" },
  { value: "esim", label: "eSIM" },
] as const;

interface PlanOption {
  id: string;
  title: string;
  partnerName: string | null;
}

interface CouponCheck {
  valid: true;
  discount_type: "fixed" | "percent";
  discount_value: number;
}

function couponDiscountLabel(c: CouponCheck) {
  return c.discount_type === "percent" ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString("ko-KR")}원 할인`;
}

export function UsimApplyForm({ initialPlanId }: { initialPlanId: string | null }) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [planId, setPlanId] = useState(initialPlanId ?? "");
  const [applicantName, setApplicantName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [activationType, setActivationType] = useState<(typeof ACTIVATION_TYPES)[number]["value"]>("port");
  const [simType, setSimType] = useState<(typeof SIM_TYPE_OPTIONS)[number]["value"]>("usim");
  const [preferredDate, setPreferredDate] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
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
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "usim").maybeSingle();
      if (!category) return;
      const { data } = await supabase
        .from("products")
        .select("id, title, partners(name)")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("title");
      setPlans(
        (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          partnerName: (p.partners as unknown as { name: string } | null)?.name ?? null,
        })),
      );
    })();
  }, []);

  async function checkCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "usim").maybeSingle();
      const { data, error } = await supabase.rpc("fn_validate_coupon", {
        p_code: code,
        p_profile_id: user?.id ?? null,
        p_category_id: category?.id ?? null,
      });
      if (error || !data?.valid) {
        setCouponError(data?.error ?? "쿠폰 확인 중 문제가 발생했습니다.");
        return;
      }
      setCouponResult(data as CouponCheck);
    } finally {
      setCouponChecking(false);
    }
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!planId) next.planId = "요금제를 선택해 주세요.";
    if (!applicantName.trim()) next.applicantName = "신청자 이름을 입력해 주세요.";
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
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "usim").maybeSingle();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const activationLabel = ACTIVATION_TYPES.find((a) => a.value === activationType)?.label ?? activationType;
      const simTypeLabel = SIM_TYPE_OPTIONS.find((s) => s.value === simType)?.label ?? simType;

      const leadId = crypto.randomUUID();
      const referral = getStoredReferral();
      const utm = getStoredUtm();

      const { error } = await supabase.from("leads").insert({
        id: leadId,
        category_id: category?.id ?? null,
        product_id: planId,
        user_id: user?.id ?? null,
        status: "received",
        referral_code_id: referral?.codeId ?? null,
        guest_contact: {
          applicantName,
          birthDate,
          phone,
          activationType,
          activationTypeLabel: activationLabel,
          simType,
          simTypeLabel,
          preferredDate,
        },
        consent: { terms: consentTerms, privacy: consentPrivacy, marketing: consentMarketing },
        referrer_url: typeof window !== "undefined" ? window.location.href : null,
        utm_source: utm?.utm_source ?? null,
        utm_medium: utm?.utm_medium ?? null,
        utm_campaign: utm?.utm_campaign ?? null,
      });
      if (error) throw error;

      if (couponResult && couponCode.trim()) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          await supabase.rpc("fn_redeem_coupon", {
            p_code: couponCode.trim().toUpperCase(),
            p_lead_id: leadId,
            p_profile_id: user?.id ?? null,
            p_category_id: category?.id ?? null,
          });
        } catch {
          // 쿠폰 최종 적용 실패해도 신청 자체는 이미 접수되었으므로 무시
        }
      }

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "usim_lead", id: leadId }),
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
        <label className="text-sm font-bold text-[var(--brand-navy)]">1. 요금제 선택 *</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        >
          <option value="">선택해 주세요</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.partnerName ? `[${p.partnerName}] ` : ""}
              {p.title}
            </option>
          ))}
        </select>
        {errors.planId && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.planId}</p>}
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">2. 개통 방식 *</label>
        <div className="mt-2 flex gap-4">
          {ACTIVATION_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="activationType"
                checked={activationType === opt.value}
                onChange={() => setActivationType(opt.value)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">3. 유심 타입 *</label>
        <div className="mt-2 flex gap-4">
          {SIM_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="simType"
                checked={simType === opt.value}
                onChange={() => setSimType(opt.value)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">4. 신청자 이름 *</label>
        <input
          type="text"
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
        {errors.applicantName && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{errors.applicantName}</p>}
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

      <div>
        <label className="text-sm font-bold text-[var(--brand-navy)]">쿠폰 코드 (선택)</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="보유하신 쿠폰 코드를 입력해 주세요"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponResult(null);
              setCouponError(null);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-[var(--brand-blue)] focus:outline-none"
          />
          <button
            type="button"
            onClick={checkCoupon}
            disabled={couponChecking || !couponCode.trim()}
            className="shrink-0 rounded-lg border border-[var(--brand-blue)] px-4 text-xs font-semibold text-[var(--brand-blue)] disabled:opacity-50"
          >
            {couponChecking ? "확인 중..." : "적용"}
          </button>
        </div>
        {couponResult && (
          <p className="mt-1.5 text-xs font-semibold text-[var(--brand-mint)]">쿠폰이 적용되었습니다 · {couponDiscountLabel(couponResult)}</p>
        )}
        {couponError && <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{couponError}</p>}
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
