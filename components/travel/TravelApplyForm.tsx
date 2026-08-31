"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral } from "@/lib/referral/client";

// CRIS 골프 체험 프로그램 신청 페이지. 원본(vscode_pplan/index.html, ppartners 배포본)의
// 신청서 항목·검증 로직·회차 일정을 그대로 유지하되 PlanPartners 블루 컨셉으로 재구성했다.
// 상단 "진행 절차" 5단계 안내는 원본/여기캠프 자료 어디에도 실제 본문이 없어 이번에 초안으로
// 작성했다 — 출입국·캠프 규칙 등 사실관계가 걸린 내용이라 파트너사 확인 전까지는 초안임을
// 화면에 명시한다.
const PROCEDURE_STEPS = [
  {
    id: "selection",
    label: "대상자 선정",
    body: [
      "초등학교 4학년 ~ 고등학교 2학년 학생을 대상으로 하며, 골프 국제학교 진학을 고려 중인 학생을 우선으로 안내합니다.",
      "영어 실력과 골프 경력은 참가 조건이 아닙니다 — 체험 목적의 참가도 가능합니다.",
      "신청서 접수 후 담당자가 참가 가능 여부(회차별 정원, 건강 상태 등)를 확인하고 개별 연락드립니다.",
    ],
  },
  {
    id: "pre-departure",
    label: "출국전 준비사항",
    body: [
      "여권 유효기간이 6개월 이상 남아 있는지 확인해 주세요. 미소지 시 사전에 발급을 진행해야 합니다.",
      "왕복 항공권은 참가자가 개별 예약합니다 — 배정된 회차의 입소일(토요일)에 맞춰 예약해 주세요.",
      "골프화, 편한 복장, 개인 상비약, 여벌 옷 등을 준비물로 안내드리며 상세 목록은 접수 확정 후 별도 안내드립니다.",
      "복용 중인 약이나 지병이 있는 경우 신청서 9번 항목에 반드시 기재해 주세요.",
    ],
  },
  {
    id: "arrival",
    label: "도착시 진행절차",
    body: [
      "치앙마이 국제공항 도착 후 캠프 관계자와 합류하여 치앙라이 캠퍼스로 이동합니다.",
      "도착 당일 오리엔테이션을 통해 기숙사 배정, 일과표, 담당 교사를 안내받습니다.",
      "다음 날부터 정규 일과(수업 · 골프 레슨 · 자유 활동)에 합류하며, 세부 일정은 페이지 하단 SCHEDULE을 참고해 주세요.",
    ],
  },
  {
    id: "rules",
    label: "캠프규칙안내",
    body: [
      "기숙사 통금 및 소등 시간을 준수해야 하며, 교내에서는 지정된 교복 또는 활동복을 착용합니다.",
      "휴대전화 사용은 지정된 자유 시간에만 허용됩니다.",
      "타인에 대한 폭력, 괴롭힘, 교내 시설 무단 사용은 금지되며 규칙 위반 시 보호자에게 즉시 통보됩니다.",
      "안전을 위해 캠퍼스 밖 개별 외출은 원칙적으로 금지되며, 필요 시 인솔 교사 동행하에 이동합니다.",
    ],
  },
  {
    id: "entry",
    label: "입국안내",
    body: [
      "태국 입국 시 여권, 왕복 항공권 e-티켓, 캠프 참가 확인서(접수 확정 후 제공)를 지참해 주세요.",
      "미성년자 단독 입국의 경우 국가별로 보호자 동의서 등 추가 서류가 요구될 수 있어 항공사·출입국 규정을 사전에 확인해야 합니다.",
      "입국 심사 관련 상세 요건은 신청 확정 후 최신 태국 출입국 규정 기준으로 별도 안내드립니다.",
    ],
  },
] as const;

const SESSIONS = [
  { id: "s1", label: "1차 · 9/5(토)~9/12(토)", badge: null },
  { id: "s2", label: "2차 · 9/12(일)~9/19(토)", badge: null },
  { id: "s3", label: "3차 · 9/19(토)~9/26(토) 추석", badge: "peak" },
  { id: "s4", label: "4차 · 9/26(토)~10/3(토)", badge: "promo" },
  { id: "s5", label: "5차 · 10/3(토)~10/10(토) 연휴", badge: "peak" },
  { id: "s6", label: "6차 · 10/10(토)~10/17(토)", badge: "promo" },
  { id: "s7", label: "7차 · 10/17(토)~10/24(토)", badge: "promo" },
  { id: "s8", label: "8차 · 10/24(토)~10/31(토)", badge: "promo" },
  { id: "s9", label: "9차 · 10/31(토)~11/7(토)", badge: "promo" },
  { id: "s10", label: "10차 · 11/7(토)~11/14(토)", badge: "promo" },
] as const;

const EXPERIENCE_OPTIONS = [
  "처음 참가",
  "여기캠프 지난 필리핀 캠프 참가",
  "여기캠프 지난 치앙마이 캠프 참가",
  "타 캠프 참가",
] as const;

const HEARD_FROM_OPTIONS = [
  "여기캠프",
  "iphone.kr",
  "세상에 없는 요금 YOGEUM.COM",
  "지인추천",
  "기타",
] as const;

const NOTE_OPTIONS = ["복용약", "병력", "없음", "기타"] as const;

const RE_PHONE = /^010-\d{4}-\d{4}$/;

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface FormState {
  childInfo: string;
  nickname: string;
  guardianName: string;
  phone: string;
  address: string;
  session: string;
  experience: string;
  experienceDetail: string;
  heardFrom: string;
  heardFromDetail: string;
  notes: string[];
  notesDetail: string;
  mediaConsent: string;
  consentProgram: boolean;
  consentPrivacy: boolean;
  consentUniqueId: boolean;
  consentFinal: boolean;
}

const INITIAL_STATE: FormState = {
  childInfo: "",
  nickname: "",
  guardianName: "",
  phone: "",
  address: "",
  session: "",
  experience: "",
  experienceDetail: "",
  heardFrom: "",
  heardFromDetail: "",
  notes: [],
  notesDetail: "",
  mediaConsent: "",
  consentProgram: false,
  consentPrivacy: false,
  consentUniqueId: false,
  consentFinal: false,
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-[var(--brand-navy)]">{children}</p>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[var(--brand-urgent)]">{message}</p>;
}

export function TravelApplyForm() {
  const [activeStep, setActiveStep] = useState<string>(PROCEDURE_STEPS[0].id);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNote(option: string) {
    setForm((prev) => {
      if (option === "없음") {
        return { ...prev, notes: prev.notes.includes("없음") ? [] : ["없음"] };
      }
      const withoutNone = prev.notes.filter((n) => n !== "없음");
      const has = withoutNone.includes(option);
      return { ...prev, notes: has ? withoutNone.filter((n) => n !== option) : [...withoutNone, option] };
    });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.childInfo.trim()) next.childInfo = "아이 이름 / 성별 / 학년을 입력해 주세요.";
    if (!form.nickname.trim()) next.nickname = "영어 닉네임을 입력해 주세요.";
    if (!form.guardianName.trim()) next.guardianName = "보호자 이름을 입력해 주세요.";
    if (!RE_PHONE.test(form.phone)) next.phone = "010-0000-0000 형식으로 입력해 주세요.";
    if (!form.address.trim()) next.address = "집 주소를 입력해 주세요.";
    if (!form.session) next.session = "참가 차수를 선택해 주세요.";
    if (!form.experience) next.experience = "캠프 경험을 선택해 주세요.";
    if (form.experience === "타 캠프 참가" && !form.experienceDetail.trim())
      next.experienceDetail = "캠프명 및 지역을 입력해 주세요.";
    if (form.heardFrom === "기타" && !form.heardFromDetail.trim())
      next.heardFromDetail = "내용을 입력해 주세요.";
    if (form.notes.length === 0) next.notes = "해당 사항을 선택해 주세요.";
    if (form.notes.some((n) => n !== "없음") && !form.notesDetail.trim())
      next.notesDetail = "상세 내용을 입력해 주세요.";
    if (!form.mediaConsent) next.mediaConsent = "사진 및 영상 촬영 동의 여부를 선택해 주세요.";
    if (!form.consentProgram) next.consentProgram = "참가 동의가 필요합니다.";
    if (!form.consentPrivacy) next.consentPrivacy = "개인정보 수집·이용 동의가 필요합니다.";
    if (!form.consentUniqueId) next.consentUniqueId = "고유식별정보 수집·처리 동의가 필요합니다.";
    if (!form.consentFinal) next.consentFinal = "최종 동의가 필요합니다.";
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);

    const firstInvalidKey = Object.keys(nextErrors)[0];
    if (firstInvalidKey) {
      fieldRefs.current[firstInvalidKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "travel")
        .maybeSingle();

      const sessionLabel = SESSIONS.find((s) => s.id === form.session)?.label ?? form.session;

      // 비회원(guest) 신청은 RLS select 정책상 insert 직후 .select()로 행을 되읽을 수 없어
      // (leads_select_own_or_admin이 auth.uid()=user_id를 요구, guest는 둘 다 null이라 불일치)
      // id를 클라이언트에서 미리 생성해 넘긴다 — 알림 API 호출에 그대로 재사용.
      const leadId = crypto.randomUUID();
      const referral = getStoredReferral();

      const { error } = await supabase.from("leads").insert({
        id: leadId,
        category_id: category?.id ?? null,
        status: "received",
        referral_code_id: referral?.codeId ?? null,
        guest_contact: {
          program: "CRIS 국제학교 골프 체험 프로그램",
          childInfo: form.childInfo,
          nickname: form.nickname,
          guardianName: form.guardianName,
          phone: form.phone,
          address: form.address,
          session: sessionLabel,
          experience: form.experience,
          experienceDetail: form.experienceDetail || null,
          heardFrom: form.heardFrom || null,
          heardFromDetail: form.heardFromDetail || null,
          notes: form.notes,
          notesDetail: form.notesDetail || null,
          mediaConsent: form.mediaConsent,
        },
        consent: {
          program: form.consentProgram,
          privacy: form.consentPrivacy,
          uniqueId: form.consentUniqueId,
          final: form.consentFinal,
        },
        referrer_url: typeof window !== "undefined" ? window.location.href : null,
      });

      if (error) throw error;

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "travel_lead", id: leadId }),
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
      setSubmitError("신청서 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주시거나 고객센터로 문의해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeGuide = PROCEDURE_STEPS.find((s) => s.id === activeStep) ?? PROCEDURE_STEPS[0];

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--brand-mint)] to-[var(--brand-blue)]" />
        <div className="mx-auto max-w-3xl px-4 pt-10">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">여행 · 유학 체험 프로그램</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug text-[var(--brand-navy)] sm:text-3xl">
            CRIS 국제학교 골프 체험 신청
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            대상자 선정부터 입국 안내까지, 진행 절차를 먼저 확인하고 아래 신청서를 작성해 주세요.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">진행 절차</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PROCEDURE_STEPS.map((step, i) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition ${
                activeStep === step.id
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white shadow-sm shadow-blue-200"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-blue)]/50"
              }`}
            >
              <span className="block text-[10px] opacity-70">STEP {i + 1}</span>
              {step.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[var(--brand-navy)]">{activeGuide.label}</h2>
            <span className="shrink-0 rounded-full bg-[var(--surface-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand-blue-dark)]">
              초안 · 확인 중
            </span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {activeGuide.body.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-gray-400">
            ※ 본 안내는 최종 확정 전 초안이며, 파트너사(여기캠프) 확인 후 정식 안내문으로 교체될 수 있습니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">APPLICATION</p>
        <h2 className="mt-2 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">신청자 정보</h2>
        <p className="mt-2 text-sm text-gray-500">
          아래 정보를 남겨주시면 담당자가 순차적으로 연락드립니다.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-mint)]/15 text-2xl text-[var(--brand-mint)]">
              ✓
            </div>
            <p className="mt-4 text-base font-bold text-[var(--brand-navy)]">신청서가 접수되었습니다</p>
            <p className="mt-2 text-sm text-gray-500">
              남겨주신 연락처로 담당자가 확인 후 빠르게 안내드리겠습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
            <div ref={(el) => { fieldRefs.current.childInfo = el; }}>
              <FieldLabel>1. 아이 이름 / 성별 / 학년 *</FieldLabel>
              <input
                type="text"
                placeholder="예: 이하나 / 여자 / 4학년"
                value={form.childInfo}
                onChange={(e) => update("childInfo", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.childInfo} />
            </div>

            <div ref={(el) => { fieldRefs.current.nickname = el; }}>
              <FieldLabel>2. 내 아이의 영어 닉네임 *</FieldLabel>
              <input
                type="text"
                placeholder="예: HANA"
                value={form.nickname}
                onChange={(e) => update("nickname", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.nickname} />
            </div>

            <div ref={(el) => { fieldRefs.current.guardianName = el; }}>
              <FieldLabel>3. 보호자 이름 *</FieldLabel>
              <input
                type="text"
                value={form.guardianName}
                onChange={(e) => update("guardianName", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.guardianName} />
            </div>

            <div ref={(el) => { fieldRefs.current.phone = el; }}>
              <FieldLabel>4. 보호자 휴대폰 번호 *</FieldLabel>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => update("phone", formatPhone(e.target.value))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.phone} />
            </div>

            <div ref={(el) => { fieldRefs.current.address = el; }}>
              <FieldLabel>5. 집 주소 *</FieldLabel>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.address} />
            </div>

            <div ref={(el) => { fieldRefs.current.session = el; }}>
              <FieldLabel>6. 캠프 참가 차수 선택 *</FieldLabel>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand-mint)]" />
                  프로모션 요금 · 입학금 외 30만원
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand-urgent)]" />
                  성수기 요금 · 입학금 외 60만원
                </span>
              </div>
              <select
                value={form.session}
                onChange={(e) => update("session", e.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[var(--brand-navy)] focus:border-[var(--brand-blue)] focus:outline-none"
              >
                <option value="" disabled>
                  참가 차수를 선택해 주세요
                </option>
                {SESSIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                    {s.badge ? ` — ${s.badge === "peak" ? "성수기 · +60만원" : "프로모션 · +30만원"}` : ""}
                  </option>
                ))}
              </select>
              {(() => {
                const selected = SESSIONS.find((s) => s.id === form.session);
                if (!selected?.badge) return null;
                return (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      selected.badge === "peak"
                        ? "bg-[var(--brand-urgent)]/10 text-[var(--brand-urgent)]"
                        : "bg-[var(--brand-mint)]/15 text-[var(--brand-mint)]"
                    }`}
                  >
                    {selected.badge === "peak" ? "성수기 · +60만원" : "프로모션 · +30만원"}
                  </span>
                );
              })()}
              <FieldError message={errors.session} />
            </div>

            <div ref={(el) => { fieldRefs.current.experience = el; }}>
              <FieldLabel>7. 캠프 경험 *</FieldLabel>
              <div className="mt-2 space-y-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="experience"
                      checked={form.experience === opt}
                      onChange={() => update("experience", opt)}
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {form.experience === "타 캠프 참가" && (
                <div ref={(el) => { fieldRefs.current.experienceDetail = el; }}>
                  <input
                    type="text"
                    placeholder="캠프명 및 지역을 입력해 주세요"
                    value={form.experienceDetail}
                    onChange={(e) => update("experienceDetail", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                  <FieldError message={errors.experienceDetail} />
                </div>
              )}
              <FieldError message={errors.experience} />
            </div>

            <div ref={(el) => { fieldRefs.current.heardFrom = el; }}>
              <FieldLabel>8. 여기캠프에 대해 어디서 정보를 얻으셨나요? (선택)</FieldLabel>
              <div className="mt-2 space-y-2">
                {HEARD_FROM_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="heardFrom"
                      checked={form.heardFrom === opt}
                      onChange={() => update("heardFrom", opt)}
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {form.heardFrom === "기타" && (
                <div ref={(el) => { fieldRefs.current.heardFromDetail = el; }}>
                  <input
                    type="text"
                    placeholder="내용을 입력해 주세요"
                    value={form.heardFromDetail}
                    onChange={(e) => update("heardFromDetail", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                  <FieldError message={errors.heardFromDetail} />
                </div>
              )}
            </div>

            <div ref={(el) => { fieldRefs.current.notes = el; }}>
              <FieldLabel>9. 학생 특이사항 *</FieldLabel>
              <div className="mt-2 space-y-2">
                {NOTE_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.notes.includes(opt)}
                      onChange={() => toggleNote(opt)}
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                    />
                    {opt === "병력" ? "병력 (예: 땅콩 알러지 — 아래에 상세 작성)" : opt === "복용약" ? "복용약 (아래에 상세 작성)" : opt}
                  </label>
                ))}
              </div>
              {form.notes.some((n) => n !== "없음") && (
                <div ref={(el) => { fieldRefs.current.notesDetail = el; }}>
                  <textarea
                    placeholder="복용약, 병력 등 상세 내용을 입력해 주세요"
                    value={form.notesDetail}
                    onChange={(e) => update("notesDetail", e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                  <FieldError message={errors.notesDetail} />
                </div>
              )}
              <FieldError message={errors.notes} />
            </div>

            <div ref={(el) => { fieldRefs.current.mediaConsent = el; }}>
              <FieldLabel>10. 사진 및 영상 촬영 동의 *</FieldLabel>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                캠프 진행 중 촬영된 사진·영상은 밴드, 블로그 등 홍보 목적으로 활용될 수 있습니다.
              </p>
              <div className="mt-2 flex gap-4">
                {["동의", "비동의"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="mediaConsent"
                      checked={form.mediaConsent === opt}
                      onChange={() => update("mediaConsent", opt)}
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <FieldError message={errors.mediaConsent} />
            </div>

            <details className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
              <summary className="cursor-pointer text-sm font-bold text-[var(--brand-navy)]">
                11~13. 동의서 · 개인정보 · 고유식별정보 수집 안내
              </summary>
              <div className="mt-3 space-y-3">
                <p>
                  <strong className="text-gray-700">부모 동의서</strong> — 본 프로그램 참가에 관한 세부 약관에
                  동의함을 확인합니다.
                </p>
                <p>
                  <strong className="text-gray-700">개인정보 수집·이용</strong> — 이름, 성별, 학년, 연락처, 주소
                  등을 신청 접수 및 프로그램 운영 목적으로 수집하며, 목적 달성 후 관련 법령에 따른 보존기간
                  경과 시 파기합니다.
                </p>
                <p>
                  <strong className="text-gray-700">고유식별정보 수집·처리</strong> — 여권번호 등은 항공권 예약 및
                  등록 절차상 필요한 경우에 한해 별도 안내 후 수집합니다.
                </p>
              </div>
            </details>

            <div className="space-y-3">
              <div ref={(el) => { fieldRefs.current.consentProgram = el; }}>
                <label className="flex items-start gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.consentProgram}
                    onChange={(e) => update("consentProgram", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
                  />
                  동의서의 모든 내용을 확인했으며, 참가에 동의합니다 *
                </label>
                <FieldError message={errors.consentProgram} />
              </div>
              <div ref={(el) => { fieldRefs.current.consentPrivacy = el; }}>
                <label className="flex items-start gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.consentPrivacy}
                    onChange={(e) => update("consentPrivacy", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
                  />
                  개인정보 수집 및 이용 내용을 확인하였고, 동의합니다 *
                </label>
                <FieldError message={errors.consentPrivacy} />
              </div>
              <div ref={(el) => { fieldRefs.current.consentUniqueId = el; }}>
                <label className="flex items-start gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.consentUniqueId}
                    onChange={(e) => update("consentUniqueId", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
                  />
                  고유식별정보 수집 및 처리 내용을 확인하였고, 동의합니다 *
                </label>
                <FieldError message={errors.consentUniqueId} />
              </div>
              <div ref={(el) => { fieldRefs.current.consentFinal = el; }}>
                <label className="flex items-start gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.consentFinal}
                    onChange={(e) => update("consentFinal", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]"
                  />
                  당사와 여행자는 위 계약 내용과 약관을 상호 성실히 이행 및 준수할 것을 확인하며 동의하여 본
                  신청서를 작성합니다. (본 신청서 작성함과 동시에 약관설명 의무를 다한 것으로 본다.) *
                </label>
                <FieldError message={errors.consentFinal} />
              </div>
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-[var(--brand-urgent)]">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60"
            >
              {submitting ? "제출 중..." : "신청서 제출하기"}
            </button>
            <p className="text-center text-xs text-gray-400">담당자가 순차적으로 연락드립니다</p>
          </form>
        )}
      </section>
    </main>
  );
}
