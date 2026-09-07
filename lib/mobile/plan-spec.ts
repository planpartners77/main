// 휴대폰(mobile) 카테고리 요금제 스펙 — products.extra jsonb에 이 형태로 저장한다.
// §12-11 결정(카테고리별 동적 스키마는 실제 필요해질 때 도입) — 지금이 그 시점이라
// products 테이블에 컬럼을 추가하지 않고 고정 TS 타입으로 extra jsonb 계약을 정의한다.

export type CarrierNetwork = "SKT" | "KT" | "LGU+";
export type NetworkTech = "5G" | "LTE" | "3G";
export type ThrottleSpeed = "1mbps_under" | "1mbps" | "3mbps" | "5mbps" | "10mbps" | "none";
export type SimType = "usim" | "esim" | "both";

export const CARRIER_NETWORKS: CarrierNetwork[] = ["SKT", "KT", "LGU+"];
export const NETWORK_TECHS: NetworkTech[] = ["5G", "LTE", "3G"];
export const SIM_TYPES: { value: SimType; label: string }[] = [
  { value: "usim", label: "유심" },
  { value: "esim", label: "eSIM" },
  { value: "both", label: "유심/eSIM 모두" },
];

export const THROTTLE_SPEED_OPTIONS: { value: ThrottleSpeed; label: string; helper: string }[] = [
  { value: "1mbps_under", label: "1Mbps 미만", helper: "문자 위주, 웹 서핑도 답답할 수 있어요" },
  { value: "1mbps", label: "1Mbps", helper: "카카오톡, 문자 정도만 원활해요" },
  { value: "3mbps", label: "3Mbps", helper: "저화질 영상 시청이 가능해요" },
  { value: "5mbps", label: "5Mbps", helper: "웹 서핑, SNS가 원활해요" },
  { value: "10mbps", label: "10Mbps", helper: "고화질 영상 시청도 무리 없어요" },
  { value: "none", label: "제한 없음", helper: "소진 걱정 없이 계속 빠르게 써요" },
];

export const DEDICATED_TAGS = [
  "시니어",
  "아이폰",
  "태블릿",
  "공무원",
  "워치",
  "청소년",
  "해외출국자",
  "군인",
  "복지",
] as const;
export type DedicatedTag = (typeof DEDICATED_TAGS)[number];

export const PLAN_FEATURES = ["NFC", "소액결제", "유심무료", "해외로밍", "핫스팟", "eSIM", "데이터쉐어링"] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

export interface MobilePlanExtra {
  carrier_network: CarrierNetwork;
  network_tech: NetworkTech;
  data_gb: number | null; // null = 무제한
  data_throttle_speed: ThrottleSpeed;
  call_minutes: number | null; // null = 무제한, 0 = 없음
  sms_count: number | null; // null = 무제한, 0 = 없음
  contract_months: number; // 0 = 무약정
  sim_type: SimType;
  internet_bundle: boolean;
  hotspot_gb: number | null; // null = 해당 없음
  tags: DedicatedTag[];
  features: PlanFeature[];
  eligibility_minor: boolean;
  eligibility_foreigner: boolean;
  selected_count: number;
}

export const EMPTY_MOBILE_PLAN_EXTRA: MobilePlanExtra = {
  carrier_network: "SKT",
  network_tech: "5G",
  data_gb: null,
  data_throttle_speed: "none",
  call_minutes: null,
  sms_count: null,
  contract_months: 0,
  sim_type: "usim",
  internet_bundle: false,
  hotspot_gb: null,
  tags: [],
  features: [],
  eligibility_minor: false,
  eligibility_foreigner: false,
  selected_count: 0,
};

// DB에서 읽은 extra(Record<string, unknown>)를 안전하게 MobilePlanExtra로 정규화한다.
// 관리자가 아직 구조화 폼을 쓰기 전 값이거나 필드 누락이 있어도 리스트/상세 페이지가 깨지지 않도록.
export function normalizeMobilePlanExtra(raw: Record<string, unknown> | null | undefined): MobilePlanExtra {
  const r = raw ?? {};
  const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    carrier_network: CARRIER_NETWORKS.includes(r.carrier_network as CarrierNetwork)
      ? (r.carrier_network as CarrierNetwork)
      : "SKT",
    network_tech: NETWORK_TECHS.includes(r.network_tech as NetworkTech) ? (r.network_tech as NetworkTech) : "5G",
    data_gb: typeof r.data_gb === "number" ? r.data_gb : null,
    data_throttle_speed: THROTTLE_SPEED_OPTIONS.some((o) => o.value === r.data_throttle_speed)
      ? (r.data_throttle_speed as ThrottleSpeed)
      : "none",
    call_minutes: typeof r.call_minutes === "number" ? r.call_minutes : null,
    sms_count: typeof r.sms_count === "number" ? r.sms_count : null,
    contract_months: typeof r.contract_months === "number" ? r.contract_months : 0,
    sim_type: SIM_TYPES.some((o) => o.value === r.sim_type) ? (r.sim_type as SimType) : "usim",
    internet_bundle: r.internet_bundle === true,
    hotspot_gb: typeof r.hotspot_gb === "number" ? r.hotspot_gb : null,
    tags: asStringArray(r.tags).filter((t): t is DedicatedTag => (DEDICATED_TAGS as readonly string[]).includes(t)),
    features: asStringArray(r.features).filter((f): f is PlanFeature => (PLAN_FEATURES as readonly string[]).includes(f)),
    eligibility_minor: r.eligibility_minor === true,
    eligibility_foreigner: r.eligibility_foreigner === true,
    selected_count: typeof r.selected_count === "number" ? r.selected_count : 0,
  };
}

export function dataLabel(dataGb: number | null): string {
  return dataGb == null ? "무제한" : `${dataGb}GB`;
}

export function callLabel(minutes: number | null): string {
  if (minutes == null) return "통화 무제한";
  if (minutes === 0) return "통화 없음";
  return `통화 ${minutes}분`;
}

export function smsLabel(count: number | null): string {
  if (count == null) return "문자 무제한";
  if (count === 0) return "문자 없음";
  return `문자 ${count}건`;
}
