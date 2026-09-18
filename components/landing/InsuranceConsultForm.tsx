"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral, getStoredUtm } from "@/lib/referral/client";

const INSURANCE_TYPE_OPTIONS = [
  "종신보험",
  "실손의료보험(실비보험)",
  "생명보험",
  "건강보험",
  "질병·상해보험",
  "어린이·자녀보험",
  "연금보험",
  "기타 보험상품",
];
const OTHER_INSURANCE_TYPE = "기타 보험상품";

const CARRIER_OPTIONS = ["SK", "KT", "LG", "SK알뜰폰", "KT알뜰폰", "LG알뜰폰", "기타"];

const PREFERRED_TIME_OPTIONS = ["평일 오전", "평일 오후", "저녁(18시 이후)", "주말"];

// 가입 전 알릴의무 항목 — 각 항목은 텍스트 입력이 필수이며 "없으면 없음"으로 안내한다.
// 원 스펙의 "상세내용 기입 시 체크박스 자동 활성화"는 체크박스를 없애고
// 텍스트 입력 자체를 필수로 두는 방식으로 단순화했다(빈 값이면 미기입 오류).
const PRIOR_CONDITIONS = [
  { key: "priorHypertension", label: "고혈압" },
  { key: "priorDiabetes", label: "당뇨" },
  { key: "priorHyperlipidemia", label: "고지혈증" },
  { key: "priorJointDisease", label: "관절질환(척추/팔/엘보)" },
] as const;

const RE_PHONE = /^01[0-9]-\d{3,4}-\d{4}$/;

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 주민등록번호는 개인정보보호법상 수집이 제한된 고유식별정보라 수집하지 않고
// 생년월일로 대체한다(usim/mobile 신청폼과 동일한 선례). 건강 관련 알릴의무 항목은
// 민감정보라 privacy/thirdParty와 별도의 동의(sensitiveHealth)를 추가로 받는다.
export function InsuranceConsultForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [insuranceTypes, setInsuranceTypes] = useState<string[]>([]);
  const [insuranceTypeOther, setInsuranceTypeOther] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [job, setJob] = useState("");
  const [carrier, setCarrier] = useState("");
  const [preferredTime, setPreferredTime] = useState<string>(PREFERRED_TIME_OPTIONS[0]);

  const [priorValues, setPriorValues] = useState<Record<string, string>>({});
  const [priorOtherLabel, setPriorOtherLabel] = useState("");
  const [priorOtherDetail, setPriorOtherDetail] = useState("");

  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentThirdParty, setConsentThirdParty] = useState(false);
  const [consentSensitiveHealth, setConsentSensitiveHealth] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function toggleInsuranceType(type: string) {
    setInsuranceTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (insuranceTypes.length === 0) next.insuranceTypes = "상담 가능 보험을 1개 이상 선택해 주세요.";
    if (insuranceTypes.includes(OTHER_INSURANCE_TYPE) && !insuranceTypeOther.trim()) {
      next.insuranceTypeOther = "기타 보험상품 내용을 입력해 주세요.";
    }
    if (!lastName.trim()) next.lastName = "성을 입력해 주세요.";
    if (!firstName.trim()) next.firstName = "이름을 입력해 주세요.";
    if (!birthDate.trim()) next.birthDate = "생년월일을 입력해 주세요.";
    if (!RE_PHONE.test(phone)) next.phone = "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)";
    if (!address.trim()) next.address = "주소를 입력해 주세요.";
    if (!job.trim()) next.job = "직업을 입력해 주세요.";
    if (!carrier) next.carrier = "통신사를 선택해 주세요.";
    for (const { key, label } of PRIOR_CONDITIONS) {
      if (!priorValues[key]?.trim()) next[key] = `${label} 진료 여부를 입력해 주세요. (없으면 '없음')`;
    }
    if (!consentPrivacy) next.consentPrivacy = "개인정보 수집·이용 동의가 필요합니다.";
    if (!consentThirdParty) next.consentThirdParty = "상담 연계를 위한 정보제공 동의가 필요합니다.";
    if (!consentSensitiveHealth) next.consentSensitiveHealth = "건강정보(민감정보) 수집·이용 동의가 필요합니다.";
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
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "lp").maybeSingle();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const leadId = crypto.randomUUID();
      const referral = getStoredReferral();
      const utm = getStoredUtm();

      const { error } = await supabase.from("leads").insert({
        id: leadId,
        category_id: category?.id ?? null,
        product_id: productId,
        user_id: user?.id ?? null,
        status: "received",
        referral_code_id: referral?.codeId ?? null,
        guest_contact: {
          name: `${lastName.trim()}${firstName.trim()}`,
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          birthDate,
          phone,
          address: address.trim(),
          job: job.trim(),
          carrier,
          preferredTime,
          insuranceTypes,
          insuranceTypeOther: insuranceTypes.includes(OTHER_INSURANCE_TYPE) ? insuranceTypeOther.trim() : null,
          priorHypertension: priorValues.priorHypertension?.trim() ?? "",
          priorDiabetes: priorValues.priorDiabetes?.trim() ?? "",
          priorHyperlipidemia: priorValues.priorHyperlipidemia?.trim() ?? "",
          priorJointDisease: priorValues.priorJointDisease?.trim() ?? "",
          priorOtherLabel: priorOtherLabel.trim() || null,
          priorOtherDetail: priorOtherDetail.trim() || null,
          channel: "landing_page_insurance",
        },
        consent: {
          privacy: consentPrivacy,
          thirdParty: consentThirdParty,
          sensitiveHealth: consentSensitiveHealth,
        },
        referrer_url: typeof window !== "undefined" ? window.location.href : null,
        utm_source: utm?.utm_source ?? null,
        utm_medium: utm?.utm_medium ?? null,
        utm_campaign: utm?.utm_campaign ?? null,
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
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{productTitle} 상담 신청</p>
      <p className="mt-1 text-xs text-gray-500">
        셀프가입이 아닌 상담 예약 신청입니다. 즉시 결제·가입은 진행되지 않습니다.
      </p>

      <div className="mt-4">
        <label className="text-xs text-gray-500">상담 가능 보험 (다중 선택 가능)</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INSURANCE_TYPE_OPTIONS.map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={insuranceTypes.includes(type)}
                onChange={() => toggleInsuranceType(type)}
              />
              {type}
            </label>
          ))}
        </div>
        {errors.insuranceTypes && <p className="mt-1 text-xs text-red-600">{errors.insuranceTypes}</p>}
        {insuranceTypes.includes(OTHER_INSURANCE_TYPE) && (
          <div className="mt-2">
            <input
              value={insuranceTypeOther}
              onChange={(e) => setInsuranceTypeOther(e.target.value)}
              placeholder="기타 보험상품명을 입력해 주세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.insuranceTypeOther && <p className="mt-1 text-xs text-red-600">{errors.insuranceTypeOther}</p>}
          </div>
        )}
        <p className="mt-2 text-[11px] text-gray-400">
          필요한 보험이나 현재 가입하고 있는 보험에 대해 상담이 필요한 경우 문의해 주세요.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">성</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500">이름</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">생년월일</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.birthDate && <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500">전화번호</label>
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-1234-5678"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500">주소</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500">직업</label>
          <input
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.job && <p className="mt-1 text-xs text-red-600">{errors.job}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500">통신사 (1개 선택)</label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {CARRIER_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-700">
                <input type="radio" name="carrier" checked={carrier === opt} onChange={() => setCarrier(opt)} />
                {opt}
              </label>
            ))}
          </div>
          {errors.carrier && <p className="mt-1 text-xs text-red-600">{errors.carrier}</p>}
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
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700">가입 전 알릴의무 — 최근 3년 이내 병원진료 내용</p>
        <div className="mt-3 grid gap-3">
          {PRIOR_CONDITIONS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{label}</label>
              <input
                value={priorValues[key] ?? ""}
                onChange={(e) => setPriorValues((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="없으면 '없음'으로 입력해 주세요"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500">기타(선택)</label>
            <input
              value={priorOtherLabel}
              onChange={(e) => setPriorOtherLabel(e.target.value)}
              placeholder="항목명을 입력해 주세요"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {priorOtherLabel.trim() && (
              <input
                value={priorOtherDetail}
                onChange={(e) => setPriorOtherDetail(e.target.value)}
                placeholder="상세내용을 입력해 주세요"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} />
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
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={consentSensitiveHealth}
            onChange={(e) => setConsentSensitiveHealth(e.target.checked)}
          />
          (필수) 가입 전 알릴의무 등 건강정보(민감정보) 수집·이용에 동의합니다.
        </label>
        {errors.consentSensitiveHealth && <p className="text-xs text-red-600">{errors.consentSensitiveHealth}</p>}
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
