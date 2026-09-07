import {
  CARRIER_NETWORKS,
  DEDICATED_TAGS,
  NETWORK_TECHS,
  PLAN_FEATURES,
  THROTTLE_SPEED_OPTIONS,
  type CarrierNetwork,
  type DedicatedTag,
  type UsimPlanExtra,
  type NetworkTech,
  type PlanFeature,
  type ThrottleSpeed,
} from "./plan-spec";

export interface PlanPromotionSchedule {
  month: number; // 0 = 평생(무기한) 지급, 1 이상 = 해당 월차
  amount: number;
}

export interface UsimPlanPromotion {
  id: string;
  label: string;
  type: "fixed" | "point";
  total_amount: number;
  schedule: PlanPromotionSchedule[];
  valid_from: string | null;
  valid_until: string | null;
}

export interface UsimPlanListItem {
  id: string;
  title: string;
  image_url: string | null;
  apply_url: string | null;
  base_price: number | null;
  extra: UsimPlanExtra;
  partner_id: string | null;
  partner_name: string | null;
  partner_logo_url: string | null;
  promotion: UsimPlanPromotion | null;
}

// 페이백 1개월차 지급액(카드에 강조 표시할 "실질 월 납부액" 계산용). month=0(평생) 스케줄은 그 금액을 매달 적용.
export function firstMonthPaybackAmount(promotion: UsimPlanPromotion | null): number {
  if (!promotion || promotion.schedule.length === 0) return 0;
  const lifetime = promotion.schedule.find((s) => s.month === 0);
  if (lifetime) return lifetime.amount;
  const firstMonth = promotion.schedule.find((s) => s.month === 1);
  return firstMonth?.amount ?? 0;
}

export function effectiveMonthlyPrice(item: UsimPlanListItem): number {
  const base = item.base_price ?? 0;
  return Math.max(0, base - firstMonthPaybackAmount(item.promotion));
}

export function isLifetimePromotion(promotion: UsimPlanPromotion | null): boolean {
  return !!promotion?.schedule.some((s) => s.month === 0);
}

export function promotionDurationMonths(promotion: UsimPlanPromotion | null): number {
  if (!promotion) return 0;
  if (isLifetimePromotion(promotion)) return Infinity;
  return promotion.schedule.reduce((max, s) => Math.max(max, s.month), 0);
}

// --- 데이터 사용량 프리셋 (리스트 상단 드롭다운) ---
export const DATA_USAGE_PRESETS = [
  { id: "1gb", label: "1GB", minGb: 1, helper: "전화만 가끔 쓰신다면" },
  { id: "7gb", label: "7GB", minGb: 7, helper: "웹서핑, 카톡 위주로 쓰신다면" },
  { id: "15gb", label: "15GB", minGb: 15, helper: "출퇴근길 영상을 보신다면" },
  { id: "71gb", label: "71GB", minGb: 71, helper: "매일 3시간 이상 영상을 보신다면" },
  { id: "100gb", label: "100GB+", minGb: 100, helper: "용량 걱정 없이 쓰고 싶다면" },
] as const;
export type DataUsagePresetId = (typeof DATA_USAGE_PRESETS)[number]["id"];

// --- 연속 범위 슬라이더 공통 타입 ---
// 요금제 종류가 늘어날수록 고정 구간 프리셋을 계속 추가하는 방식은 한계가 있어,
// 가격/통화량/할인기간/핫스팟 용량은 슬라이더 기반 연속 범위로 필터링한다.
// 각 SLIDER_MAX는 "그 이상"을 의미하는 상한 고정값이며, 프리셋 버튼은 슬라이더 값을
// 세팅하는 바로가기로만 남긴다(클릭 시 슬라이더가 해당 구간으로 이동).
export interface RangeValue {
  min: number;
  max: number;
}

export const PRICE_SLIDER_MAX = 60000; // 6만원 이상은 최대값으로 취급
export const CALL_SLIDER_MAX = 300; // 300분 이상은 최대값, "무제한"은 별도 토글
export const DISCOUNT_SLIDER_MAX = 24; // 24개월 이상은 최대값, "평생"은 별도 토글
export const HOTSPOT_SLIDER_MAX = 100; // 100GB 이상은 최대값

export const DEFAULT_PRICE_RANGE: RangeValue = { min: 0, max: PRICE_SLIDER_MAX };
export const DEFAULT_CALL_RANGE: RangeValue = { min: 0, max: CALL_SLIDER_MAX };
export const DEFAULT_DISCOUNT_RANGE: RangeValue = { min: 0, max: DISCOUNT_SLIDER_MAX };
export const DEFAULT_HOTSPOT_RANGE: RangeValue = { min: 0, max: HOTSPOT_SLIDER_MAX };

// --- 가격 구간 프리셋 (슬라이더 바로가기 버튼) ---
export const PRICE_RANGES = [
  { id: "0-1000", label: "0~1천원", min: 0, max: 1000 },
  { id: "0-5000", label: "0~5천원", min: 0, max: 5000 },
  { id: "5000-10000", label: "5천~1만원", min: 5000, max: 10000 },
  { id: "10000-20000", label: "1만~2만원", min: 10000, max: 20000 },
  { id: "20000-30000", label: "2만~3만원", min: 20000, max: 30000 },
  { id: "30000-50000", label: "3만~5만원", min: 30000, max: 50000 },
  { id: "50000+", label: "5만원 이상", min: 50000, max: PRICE_SLIDER_MAX },
] as const;
export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

// --- 할인(프로모션) 기간 구간 프리셋 (슬라이더 바로가기 버튼, "평생"은 별도 토글) ---
export const DISCOUNT_PERIODS = [
  { id: "24+", label: "24개월 이상", min: 24, max: DISCOUNT_SLIDER_MAX },
  { id: "12-24", label: "12~24개월", min: 12, max: 24 },
  { id: "6-12", label: "6~12개월", min: 6, max: 12 },
  { id: "1-6", label: "1~6개월", min: 1, max: 6 },
] as const;
export type DiscountPeriodId = (typeof DISCOUNT_PERIODS)[number]["id"];

// --- 통화량 구간 프리셋 (슬라이더 바로가기 버튼, "무제한"은 별도 토글) ---
export const CALL_PRESETS = [
  { id: "180-300", label: "180~300분", min: 180, max: 300 },
  { id: "60-180", label: "60~180분", min: 60, max: 180 },
  { id: "under60", label: "60분 미만", min: 0, max: 60 },
  { id: "none", label: "없음", min: 0, max: 0 },
] as const;
export type CallPresetId = (typeof CALL_PRESETS)[number]["id"];

// --- 문자량 구간 ---
export const SMS_PRESETS = [
  { id: "unlimited", label: "무제한" },
  { id: "limited", label: "구간별 제공" },
  { id: "none", label: "없음" },
] as const;
export type SmsPresetId = (typeof SMS_PRESETS)[number]["id"];

function matchesSmsPreset(count: number | null, id: SmsPresetId): boolean {
  if (id === "unlimited") return count === null;
  if (count === null) return false;
  if (id === "none") return count === 0;
  return count > 0;
}

// --- 정렬 ---
export const SORT_OPTIONS = [
  { id: "recommended", label: "추천순" },
  { id: "price_asc", label: "낮은 가격순" },
  { id: "price_after_discount_asc", label: "할인기간 후 낮은가격순" },
  { id: "popular", label: "최근 인기순" },
  { id: "data_desc", label: "데이터 많은순" },
] as const;
export type SortId = (typeof SORT_OPTIONS)[number]["id"];

// --- 퀵 필터 칩 ---
// 원문의 "LG 자회사 / KT 자회사" 계열사 분류는 별도 통신사 마스터 테이블이 있어야 가능한데,
// 우리는 카테고리 공용 partners 테이블만 쓰므로 통신망(SKT/KT/LGU+) 기준 칩으로 대체했다.
export const QUICK_CHIPS = [
  { id: "zero", label: "혜택가 0원", emoji: "🎁", tint: "bg-green-50" },
  { id: "under10k_lifetime", label: "평생 1만원 이하", emoji: "💰", tint: "bg-amber-50" },
  { id: "skt", label: "SKT망", emoji: "📶", tint: "bg-red-50" },
  { id: "kt", label: "KT망", emoji: "📡", tint: "bg-purple-50" },
  { id: "hot", label: "지금 HOT", emoji: "🔥", tint: "bg-orange-50" },
] as const;
export type QuickChipId = (typeof QUICK_CHIPS)[number]["id"];

export const HOT_SELECTED_COUNT_THRESHOLD = 100;

export interface UsimFilterState {
  dataUsage: DataUsagePresetId | null;
  throttleSpeeds: ThrottleSpeed[];
  callRange: RangeValue;
  callUnlimitedOnly: boolean;
  priceRange: RangeValue;
  discountRange: RangeValue;
  discountLifetimeOnly: boolean;
  carrierNetworks: CarrierNetwork[];
  networkTechs: NetworkTech[];
  partnerIds: string[];
  internetBundleOnly: boolean;
  smsPresets: SmsPresetId[];
  features: PlanFeature[];
  hotspotRange: RangeValue;
  dedicatedTags: DedicatedTag[];
  eligibilityMinor: boolean;
  eligibilityForeigner: boolean;
  paybackOnly: boolean;
  search: string;
}

export const EMPTY_FILTER_STATE: UsimFilterState = {
  dataUsage: null,
  throttleSpeeds: [],
  callRange: DEFAULT_CALL_RANGE,
  callUnlimitedOnly: false,
  priceRange: DEFAULT_PRICE_RANGE,
  discountRange: DEFAULT_DISCOUNT_RANGE,
  discountLifetimeOnly: false,
  carrierNetworks: [],
  networkTechs: [],
  partnerIds: [],
  internetBundleOnly: false,
  smsPresets: [],
  features: [],
  hotspotRange: DEFAULT_HOTSPOT_RANGE,
  dedicatedTags: [],
  eligibilityMinor: false,
  eligibilityForeigner: false,
  paybackOnly: false,
  search: "",
};

function isRangeActive(range: RangeValue, def: RangeValue): boolean {
  return range.min !== def.min || range.max !== def.max;
}

export function activeFilterCount(f: UsimFilterState): number {
  let n = 0;
  if (f.dataUsage) n++;
  n += f.throttleSpeeds.length;
  if (f.callUnlimitedOnly || isRangeActive(f.callRange, DEFAULT_CALL_RANGE)) n++;
  if (isRangeActive(f.priceRange, DEFAULT_PRICE_RANGE)) n++;
  if (f.discountLifetimeOnly || isRangeActive(f.discountRange, DEFAULT_DISCOUNT_RANGE)) n++;
  n += f.carrierNetworks.length;
  n += f.networkTechs.length;
  n += f.partnerIds.length;
  if (f.internetBundleOnly) n++;
  n += f.smsPresets.length;
  n += f.features.length;
  if (isRangeActive(f.hotspotRange, DEFAULT_HOTSPOT_RANGE)) n++;
  n += f.dedicatedTags.length;
  if (f.eligibilityMinor) n++;
  if (f.eligibilityForeigner) n++;
  if (f.paybackOnly) n++;
  return n;
}

export function matchesFilter(item: UsimPlanListItem, f: UsimFilterState): boolean {
  const e = item.extra;

  if (f.dataUsage) {
    const preset = DATA_USAGE_PRESETS.find((p) => p.id === f.dataUsage)!;
    const ok = e.data_gb === null || e.data_gb >= preset.minGb;
    if (!ok) return false;
  }

  if (f.throttleSpeeds.length > 0 && !f.throttleSpeeds.includes(e.data_throttle_speed)) return false;

  if (f.callUnlimitedOnly) {
    if (e.call_minutes !== null) return false;
  } else if (isRangeActive(f.callRange, DEFAULT_CALL_RANGE)) {
    if (e.call_minutes === null) return false;
    const max = f.callRange.max >= CALL_SLIDER_MAX ? Infinity : f.callRange.max;
    if (e.call_minutes < f.callRange.min || e.call_minutes > max) return false;
  }

  if (f.smsPresets.length > 0 && !f.smsPresets.some((id) => matchesSmsPreset(e.sms_count, id))) return false;

  if (isRangeActive(f.priceRange, DEFAULT_PRICE_RANGE)) {
    const price = effectiveMonthlyPrice(item);
    const max = f.priceRange.max >= PRICE_SLIDER_MAX ? Infinity : f.priceRange.max;
    if (price < f.priceRange.min || price > max) return false;
  }

  if (f.discountLifetimeOnly) {
    if (!isLifetimePromotion(item.promotion)) return false;
  } else if (isRangeActive(f.discountRange, DEFAULT_DISCOUNT_RANGE)) {
    const months = promotionDurationMonths(item.promotion);
    if (months === Infinity) return false;
    const max = f.discountRange.max >= DISCOUNT_SLIDER_MAX ? Infinity : f.discountRange.max;
    if (months < f.discountRange.min || months > max) return false;
  }

  if (f.carrierNetworks.length > 0 && !f.carrierNetworks.includes(e.carrier_network)) return false;
  if (f.networkTechs.length > 0 && !f.networkTechs.includes(e.network_tech)) return false;
  if (f.partnerIds.length > 0 && (!item.partner_id || !f.partnerIds.includes(item.partner_id))) return false;
  if (f.internetBundleOnly && !e.internet_bundle) return false;

  if (isRangeActive(f.hotspotRange, DEFAULT_HOTSPOT_RANGE)) {
    const gb = e.hotspot_gb ?? 0;
    const max = f.hotspotRange.max >= HOTSPOT_SLIDER_MAX ? Infinity : f.hotspotRange.max;
    if (gb < f.hotspotRange.min || gb > max) return false;
  }

  if (f.features.length > 0 && !f.features.every((feat) => e.features.includes(feat))) return false;
  if (f.dedicatedTags.length > 0 && !f.dedicatedTags.some((tag) => e.tags.includes(tag))) return false;

  if (f.eligibilityMinor && !e.eligibility_minor) return false;
  if (f.eligibilityForeigner && !e.eligibility_foreigner) return false;

  if (f.paybackOnly && !item.promotion) return false;

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = `${item.title} ${item.partner_name ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function matchesQuickChip(item: UsimPlanListItem, chip: QuickChipId): boolean {
  if (chip === "zero") return effectiveMonthlyPrice(item) === 0;
  if (chip === "under10k_lifetime") return isLifetimePromotion(item.promotion) && effectiveMonthlyPrice(item) <= 10000;
  if (chip === "skt") return item.extra.carrier_network === "SKT";
  if (chip === "kt") return item.extra.carrier_network === "KT";
  return item.extra.selected_count >= HOT_SELECTED_COUNT_THRESHOLD;
}

export function sortPlans(items: UsimPlanListItem[], sort: SortId): UsimPlanListItem[] {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => effectiveMonthlyPrice(a) - effectiveMonthlyPrice(b));
    case "price_after_discount_asc":
      return arr.sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0));
    case "popular":
      return arr.sort((a, b) => b.extra.selected_count - a.extra.selected_count);
    case "data_desc":
      return arr.sort((a, b) => {
        const av = a.extra.data_gb ?? Infinity;
        const bv = b.extra.data_gb ?? Infinity;
        return bv - av;
      });
    case "recommended":
    default:
      return arr.sort((a, b) => {
        if (b.extra.selected_count !== a.extra.selected_count) return b.extra.selected_count - a.extra.selected_count;
        return effectiveMonthlyPrice(a) - effectiveMonthlyPrice(b);
      });
  }
}

export { CARRIER_NETWORKS, NETWORK_TECHS, DEDICATED_TAGS, PLAN_FEATURES, THROTTLE_SPEED_OPTIONS };
