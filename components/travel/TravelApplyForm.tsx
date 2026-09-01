"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral } from "@/lib/referral/client";

// CRIS 골프 체험 프로그램 신청 페이지. 원본(vscode_pplan/index.html, ppartners 배포본)의
// 신청서 항목·검증 로직·회차 일정을 그대로 유지하되 PlanPartners 블루 컨셉으로 재구성했다.
// 상단 "진행 절차" 단계 안내 중 준비물 표(PREPARATION_TABLE)와 "현지 생활 안내" 단계의
// 일정변동/귀중품/세탁/위생/복약/비상연락망 항목은 여기캠프가 제공한 공식 안내장을 그대로 반영했다.
// 나머지 항목은 아직 자체 작성 초안이므로 추가 사실관계 확인이 필요할 수 있다.
type ProcedureStep = {
  id: string;
  label: string;
  body: string[];
  table?: { group: string; item: string; note: string }[];
};

// 준비물 표는 여기캠프에서 받은 공식 안내장(구분/품목/비고)을 그대로 옮긴 것 — 금지품목까지 포함.
const PREPARATION_TABLE: NonNullable<ProcedureStep["table"]> = [
  { group: "필수 준비물", item: "세면도구", note: "개인 샴푸, 린스, 바디워시, 세안제, 치약, 칫솔 등 (호텔 구비: 샴푸, 바디워시, 치약, 칫솔)" },
  { group: "필수 준비물", item: "골프", note: "골프장갑, 골프채(지참 가능 시)" },
  { group: "필수 준비물", item: "모자", note: "자외선 차단 가능한 것" },
  { group: "필수 준비물", item: "신발", note: "운동화, 슬리퍼(실외 슬리퍼), 아쿠아슈즈" },
  { group: "필수 준비물", item: "상비약", note: "감기약(해열제·콧물감기약 등 평소 복용약), 멀미약, 버물리, 모기퇴치제, 후시딘, 밴드, 소화제 등" },
  { group: "필수 준비물", item: "용돈", note: "개인 간식비 - 하루 약 50~100바트" },
  { group: "필수 준비물", item: "텀블러", note: "잘 깨지지 않는 물병 또는 텀블러" },
  { group: "필수 준비물", item: "썬크림", note: "자외선 차단지수 높은 것" },
  { group: "필수 준비물", item: "수영복 / 물안경", note: "물안경 필수, 수영모자는 선택" },
  { group: "필수 준비물", item: "가방", note: "물통, 필기도구 등 개인 물품을 넣을 가방" },
  { group: "필수 준비물", item: "필기도구", note: "연필, 지우개, 노트 1권" },
  { group: "필수 준비물", item: "위생용품", note: "손톱깎기, 여성용 위생용품" },
  { group: "필수 준비물", item: "의복", note: "반팔/반바지, 긴팔 또는 가디건, 얇은 긴바지 1벌, 속옷·양말 등 (골프텔 내 개별 세탁기 있음)" },
  { group: "필수 준비물", item: "우산", note: "가방에 넣을 수 있는 접는 우산 또는 우비" },
  { group: "선택 준비물", item: "샤워 헤드", note: "필터형 샤워헤드" },
  { group: "선택 준비물", item: "스마트폰", note: "랩탑·태블릿 등은 이용 허용 시간에만 사용 가능" },
  { group: "선택 준비물", item: "보조배터리", note: "기내에만 반입 가능 (위탁 수하물 절대 금지)" },
  { group: "선택 준비물", item: "도서류", note: "본인이 읽고 싶은 책" },
  { group: "선택 준비물", item: "화장품류", note: "스킨, 로션 등" },
  { group: "금지 품목", item: "주류, 담배류", note: "전자담배 포함 모든 종류" },
  { group: "금지 품목", item: "무기류", note: "무기가 될 수 있는 모든 품목" },
  { group: "금지 품목", item: "향정신성 약물", note: "치료 목적의 약은 사전에 반드시 알려주세요" },
];

const PROCEDURE_STEPS: ProcedureStep[] = [
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
      "항공 예약 시 수하물 규정을 꼭 확인해 주세요 — 기내 수하물 10kg, 위탁 수하물 15kg이며 골프클럽·여행가방 포함 초과되지 않도록 사전 체크가 필요합니다.",
      "여행자보험은 선택 사항이며, 준비물(필수·선택·금지 품목)은 아래 표를 참고해 주세요.",
      "복용 중인 약이나 지병이 있는 경우 신청서 9번 항목에 반드시 기재해 주세요.",
    ],
    table: PREPARATION_TABLE,
  },
  {
    id: "camp-life",
    label: "현지 생활 안내",
    body: [
      "환전은 골프텔(콘도) 내에서 가능하며, 센트럴 백화점 환전소가 환율 우대를 제공합니다.",
      "식사 시간은 조식 6시~8시, 중식 11:30~13:30, 석식 17:30~19:00입니다.",
      "수영장 이용 시 비치타올은 별도 제공되지 않으며, 콘도에 비치된 타올을 사용합니다.",
      "학생 라운딩 시 캐디피·캐디팁(650바트)은 현지에서 직접 지불하며, 주 1회(금요일) 라운딩이 가능한 학생에 한해 진행됩니다 (초보자 제외).",
      "정규 수업 중 태국어 수업은 한국의 국어 수업에 해당하며, 모든 학생이 함께 참여합니다.",
      "캠프는 다양한 체험 활동 중심으로 구성되어 있어 날씨나 현지 상황에 따라 일정이 일부 변경될 수 있으며, 변경 시 실시간으로 안내드립니다.",
      "골프텔 내에서도 브랜드 의류·귀금속 등 고가품은 분실 위험이 있어 지참하지 않도록 아이들을 지도해 주시고, 꼭 필요한 경우에도 잘 관리할 수 있도록 사전에 안내해 주세요.",
      "골프텔 내에 세탁기가 비치되어 있어 별도 세탁 서비스 없이 이용 가능합니다.",
      "기본 세면도구·위생용품은 개인 준비가 필요하며, 썬크림·모자·물병·여벌 옷 등 건강·위생 용품도 함께 챙겨 주세요.",
      "복용 중인 약이 있을 경우 출국 전 반드시 챙겨 주시고, 현지에서도 건강 상태를 수시로 체크해 필요 시 보호자님께 신속히 연락드립니다.",
      "카카오톡 공지방을 통해 모든 안내와 실시간 사진·캠프 상황을 공유하며 보호자님과 소통합니다.",
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
      "휴대전화 사용은 지정된 자유 시간에만 허용됩니다.",
      "타인에 대한 폭력, 괴롭힘, 교내 시설 무단 사용은 금지되며 규칙 위반 시 보호자에게 즉시 통보됩니다.",
      "안전을 위해 캠퍼스 밖 개별 외출은 원칙적으로 금지되며, 필요 시 인솔 교사 동행하에 이동합니다.",
    ],
  },
  {
    id: "entry",
    label: "입국안내",
    body: [
      "캠프 신청 후 담당자가 개별 전화드려 신청 차수에 따른 비행기 예약, 도착지 픽업 시간, 세부 스케줄을 안내드립니다.",
      "태국 입국 시 여권, 왕복 항공권 e-티켓, 캠프 참가 확인서(접수 확정 후 제공)를 지참해 주세요.",
      "미성년자 단독 입국의 경우 국가별로 보호자 동의서 등 추가 서류가 요구될 수 있어 항공사·출입국 규정을 사전에 확인해야 합니다.",
      "입국 심사 관련 상세 요건은 신청 확정 후 최신 태국 출입국 규정 기준으로 별도 안내드립니다.",
    ],
  },
];

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
  "KT 임직원",
  "LGU+ 임직원",
  "SKT 임직원",
  "삼성 임직원",
  "단무지(주) 제휴",
  "iphone.kr",
  "하이닉스 임직원",
  "플랜파트너스",
  "HandlerOne(인플루언서)",
  "체리포인트",
  "기타 지인 추천인",
] as const;

const HEARD_FROM_ETC = HEARD_FROM_OPTIONS[HEARD_FROM_OPTIONS.length - 1];

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
  guardianNameEn: string;
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
  couponCode: string;
  consentProgram: boolean;
  consentPrivacy: boolean;
  consentUniqueId: boolean;
  consentFinal: boolean;
}

const INITIAL_STATE: FormState = {
  childInfo: "",
  nickname: "",
  guardianName: "",
  guardianNameEn: "",
  phone: "",
  address: "",
  session: "",
  experience: "",
  experienceDetail: "",
  heardFrom: HEARD_FROM_ETC,
  heardFromDetail: "",
  notes: [],
  notesDetail: "",
  mediaConsent: "",
  couponCode: "",
  consentProgram: false,
  consentPrivacy: false,
  consentUniqueId: false,
  consentFinal: false,
};

interface CouponCheck {
  valid: true;
  discount_type: "fixed" | "percent";
  discount_value: number;
}

function couponDiscountLabel(c: CouponCheck) {
  return c.discount_type === "percent" ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString("ko-KR")}원 할인`;
}

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
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponFinalWarning, setCouponFinalWarning] = useState<string | null>(null);
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

  async function checkCoupon() {
    const code = form.couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: category } = await supabase.from("categories").select("id").eq("slug", "travel").maybeSingle();

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
    if (!form.childInfo.trim()) next.childInfo = "아이 이름 / 성별 / 학년을 입력해 주세요.";
    if (!form.nickname.trim()) next.nickname = "영어 닉네임을 입력해 주세요.";
    if (!form.guardianName.trim()) next.guardianName = "보호자 이름 / 관계를 입력해 주세요.";
    if (!form.guardianNameEn.trim()) next.guardianNameEn = "보호자 영문이름을 입력해 주세요.";
    if (!RE_PHONE.test(form.phone)) next.phone = "010-0000-0000 형식으로 입력해 주세요.";
    if (!form.address.trim()) next.address = "집 주소를 입력해 주세요.";
    if (!form.session) next.session = "참가 차수를 선택해 주세요.";
    if (!form.experience) next.experience = "캠프 경험을 선택해 주세요.";
    if (form.experience === "타 캠프 참가" && !form.experienceDetail.trim())
      next.experienceDetail = "캠프명 및 지역을 입력해 주세요.";
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
          guardianNameEn: form.guardianNameEn,
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

      if (couponResult && form.couponCode.trim()) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const { data } = await supabase.rpc("fn_redeem_coupon", {
            p_code: form.couponCode.trim().toUpperCase(),
            p_lead_id: leadId,
            p_profile_id: user?.id ?? null,
            p_category_id: category?.id ?? null,
          });
          if (!data?.valid) {
            setCouponFinalWarning(`쿠폰 최종 적용에 실패했습니다(${data?.error ?? "알 수 없는 오류"}). 신청서는 정상 접수되었습니다.`);
          }
        } catch {
          setCouponFinalWarning("쿠폰 최종 적용 확인 중 문제가 발생했습니다. 신청서는 정상 접수되었습니다.");
        }
      }

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
            CRIS 국제학교 원어민 영어 및 골프 체험 신청
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            대상자 선정부터 입국 안내까지, 진행 절차를 먼저 확인하고 아래 신청서를 작성해 주세요.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">진행 절차</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
              필수 안내
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
          {activeGuide.table && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">구분</th>
                    <th className="px-3 py-2 font-semibold">품목</th>
                    <th className="px-3 py-2 font-semibold">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const table = activeGuide.table!;
                    let lastGroup = "";
                    return table.map((row, i) => {
                      const isNewGroup = row.group !== lastGroup;
                      lastGroup = row.group;
                      return (
                        <tr key={`${row.group}-${row.item}-${i}`} className="border-t border-gray-100 align-top">
                          {isNewGroup && (
                            <td
                              rowSpan={table.filter((r) => r.group === row.group).length}
                              className="border-r border-gray-100 px-3 py-2 font-semibold text-[var(--brand-navy)]"
                            >
                              {row.group}
                            </td>
                          )}
                          <td className="px-3 py-2 font-medium text-gray-700">{row.item}</td>
                          <td className="px-3 py-2 leading-relaxed text-gray-500">{row.note}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
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
            {couponFinalWarning && (
              <p className="mt-4 rounded-lg bg-orange-50 px-4 py-3 text-xs font-medium text-orange-600">
                {couponFinalWarning}
              </p>
            )}
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
              <FieldLabel>3. 보호자 이름 / 관계 *</FieldLabel>
              <input
                type="text"
                placeholder="예: 홍길동 / 아빠"
                value={form.guardianName}
                onChange={(e) => update("guardianName", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
              />
              <FieldError message={errors.guardianName} />
              <div ref={(el) => { fieldRefs.current.guardianNameEn = el; }} className="mt-3">
                <label className="text-xs font-semibold text-gray-500">보호자 영문이름 *</label>
                <input
                  type="text"
                  placeholder="예: HONG GILDONG"
                  value={form.guardianNameEn}
                  onChange={(e) => update("guardianNameEn", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                />
                <FieldError message={errors.guardianNameEn} />
              </div>
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
              <FieldLabel>8. 추천인(선택)</FieldLabel>
              <select
                value={form.heardFrom}
                onChange={(e) => update("heardFrom", e.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[var(--brand-navy)] focus:border-[var(--brand-blue)] focus:outline-none"
              >
                {HEARD_FROM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {form.heardFrom === HEARD_FROM_ETC && (
                <div ref={(el) => { fieldRefs.current.heardFromDetail = el; }}>
                  <input
                    type="text"
                    placeholder="추천인 성함을 입력해 주세요"
                    value={form.heardFromDetail}
                    onChange={(e) => update("heardFromDetail", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
                  />
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

            <div>
              <FieldLabel>쿠폰 코드 (선택)</FieldLabel>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="보유하신 쿠폰 코드를 입력해 주세요"
                  value={form.couponCode}
                  onChange={(e) => {
                    update("couponCode", e.target.value);
                    setCouponResult(null);
                    setCouponError(null);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-[var(--brand-blue)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={checkCoupon}
                  disabled={couponChecking || !form.couponCode.trim()}
                  className="shrink-0 rounded-lg border border-[var(--brand-blue)] px-4 text-xs font-semibold text-[var(--brand-blue)] disabled:opacity-50"
                >
                  {couponChecking ? "확인 중..." : "적용"}
                </button>
              </div>
              {couponResult && (
                <p className="mt-1.5 text-xs font-semibold text-[var(--brand-mint)]">
                  쿠폰이 적용되었습니다 · {couponDiscountLabel(couponResult)}
                </p>
              )}
              <FieldError message={couponError ?? undefined} />
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
