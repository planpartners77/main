import {
  CARRIER_NETWORKS,
  DEDICATED_TAGS,
  NETWORK_TECHS,
  PLAN_FEATURES,
  THROTTLE_SPEED_OPTIONS,
  type CarrierNetwork,
  type DedicatedTag,
  type MobilePlanExtra,
  type NetworkTech,
  type PlanFeature,
  type ThrottleSpeed,
} from "./plan-spec";

export interface PlanPromotionSchedule {
  month: number; // 0 = 평생(무기한) 지급, 1 이상 = 해당 월차
  amount: number;
}

export interface MobilePlanPromotion {
  id: string;
  label: string;
  type: "fixed" | "point";
  total_amount: number;
  schedule: PlanPromotionSchedule[];
  valid_from: string | null;
  valid_until: string | null;
}

export interface MobilePlanListItem {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
  extra: MobilePlanExtra;
  partner_id: string | null;
  partner_name: string | null;
  promotion: MobilePlanPromotion | null;
}

// 페이백 1개월차 지급액(카드에 강조 표시할 "실질 월 납부액" 계산용). month=0(평생) 스케줄은 그 금액을 매달 적용.
export function firstMonthPaybackAmount(promotion: MobilePlanPromotion | null): number {
  if (!promotion || promotion.schedule.length === 0) return 0;
  const lifetime = promotion.schedule.find((s) => s.month === 0);
  if (lifetime) return lifetime.amount;
  const firstMonth = promotion.schedule.find((s) => s.month === 1);
  return firstMonth?.amount ?? 0;
}

export function effectiveMonthlyPrice(item: MobilePlanListItem): number {
  const base = item.base_price ?? 0;
  return Math.max(0, base - firstMonthPaybackAmount(item.promotion));
}

export function isLifetimePromotion(promotion: MobilePlanPromotion | null): boolean {
  return !!promotion?.schedule.some((s) => s.month === 0);
}

export function promotionDurationMonths(promotion: MobilePlanPromotion | null): number {
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

// --- 가격 구간 (중복 포함 구간 그대로 — 사용자가 겹치는 예산 구간을 동시에 체크할 수 있게) ---
export const PRICE_RANGES = [
  { id: "0-1000", label: "0~1천원", min: 0, max: 1000 },
  { id: "0-5000", label: "0~5천원", min: 0, max: 5000 },
  { id: "5000-10000", label: "5천~1만원", min: 5000, max: 10000 },
  { id: "10000-20000", label: "1만~2만원", min: 10000, max: 20000 },
  { id: "20000-30000", label: "2만~3만원", min: 20000, max: 30000 },
  { id: "30000-50000", label: "3만~5만원", min: 30000, max: 50000 },
  { id: "50000+", label: "5만원 이상", min: 50000, max: Infinity },
] as const;
export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

// --- 할인(프로모션) 기간 구간 ---
export const DISCOUNT_PERIODS = [
  { id: "lifetime", label: "평생" },
  { id: "24+", label: "24개월 이상" },
  { id: "12-24", label: "12~24개월" },
  { id: "6-12", label: "6~12개월" },
  { id: "1-6", label: "1~6개월" },
] as const;
export type DiscountPeriodId = (typeof DISCOUNT_PERIODS)[number]["id"];

function matchesDiscountPeriod(months: number, id: DiscountPeriodId): boolean {
  if (id === "lifetime") return months === Infinity;
  if (months === Infinity) return false;
  if (id === "24+") return months >= 24;
  if (id === "12-24") return months >= 12 && months < 24;
  if (id === "6-12") return months >= 6 && months < 12;
  return months >= 1 && months < 6;
}

// --- 통화량 구간 ---
export const CALL_PRESETS = [
  { id: "unlimited", label: "무제한" },
  { id: "180-300", label: "180~300분" },
  { id: "60-180", label: "60~180분" },
  { id: "under60", label: "60분 미만" },
  { id: "none", label: "없음" },
] as const;
export type CallPresetId = (typeof CALL_PRESETS)[number]["id"];

function matchesCallPreset(minutes: number | null, id: CallPresetId): boolean {
  if (id === "unlimited") return minutes === null;
  if (minutes === null) return false;
  if (id === "180-300") return minutes >= 180 && minutes <= 300;
  if (id === "60-180") return minutes >= 60 && minutes < 180;
  if (id === "under60") return minutes > 0 && minutes < 60;
  return minutes === 0;
}

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

export interface MobileFilterState {
  dataUsage: DataUsagePresetId | null;
  throttleSpeeds: ThrottleSpeed[];
  callPresets: CallPresetId[];
  priceRanges: PriceRangeId[];
  discountPeriods: DiscountPeriodId[];
  carrierNetworks: CarrierNetwork[];
  networkTechs: NetworkTech[];
  internetBundleOnly: boolean;
  smsPresets: SmsPresetId[];
  features: PlanFeature[];
  hotspotOnly: boolean;
  dedicatedTags: DedicatedTag[];
  eligibilityMinor: boolean;
  eligibilityForeigner: boolean;
  paybackOnly: boolean;
  search: string;
}

export const EMPTY_FILTER_STATE: MobileFilterState = {
  dataUsage: null,
  throttleSpeeds: [],
  callPresets: [],
  priceRanges: [],
  discountPeriods: [],
  carrierNetworks: [],
  networkTechs: [],
  internetBundleOnly: false,
  smsPresets: [],
  features: [],
  hotspotOnly: false,
  dedicatedTags: [],
  eligibilityMinor: false,
  eligibilityForeigner: false,
  paybackOnly: false,
  search: "",
};

export function activeFilterCount(f: MobileFilterState): number {
  let n = 0;
  if (f.dataUsage) n++;
  n += f.throttleSpeeds.length;
  n += f.callPresets.length;
  n += f.priceRanges.length;
  n += f.discountPeriods.length;
  n += f.carrierNetworks.length;
  n += f.networkTechs.length;
  if (f.internetBundleOnly) n++;
  n += f.smsPresets.length;
  n += f.features.length;
  if (f.hotspotOnly) n++;
  n += f.dedicatedTags.length;
  if (f.eligibilityMinor) n++;
  if (f.eligibilityForeigner) n++;
  if (f.paybackOnly) n++;
  return n;
}

export function matchesFilter(item: MobilePlanListItem, f: MobileFilterState): boolean {
  const e = item.extra;

  if (f.dataUsage) {
    const preset = DATA_USAGE_PRESETS.find((p) => p.id === f.dataUsage)!;
    const ok = e.data_gb === null || e.data_gb >= preset.minGb;
    if (!ok) return false;
  }

  if (f.throttleSpeeds.length > 0 && !f.throttleSpeeds.includes(e.data_throttle_speed)) return false;

  if (f.callPresets.length > 0 && !f.callPresets.some((id) => matchesCallPreset(e.call_minutes, id))) return false;

  if (f.smsPresets.length > 0 && !f.smsPresets.some((id) => matchesSmsPreset(e.sms_count, id))) return false;

  if (f.priceRanges.length > 0) {
    const price = effectiveMonthlyPrice(item);
    const ok = f.priceRanges.some((id) => {
      const range = PRICE_RANGES.find((r) => r.id === id)!;
      return price >= range.min && price <= range.max;
    });
    if (!ok) return false;
  }

  if (f.discountPeriods.length > 0) {
    const months = promotionDurationMonths(item.promotion);
    if (!f.discountPeriods.some((id) => matchesDiscountPeriod(months, id))) return false;
  }

  if (f.carrierNetworks.length > 0 && !f.carrierNetworks.includes(e.carrier_network)) return false;
  if (f.networkTechs.length > 0 && !f.networkTechs.includes(e.network_tech)) return false;
  if (f.internetBundleOnly && !e.internet_bundle) return false;
  if (f.hotspotOnly && (e.hotspot_gb == null || e.hotspot_gb <= 0)) return false;

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

export function matchesQuickChip(item: MobilePlanListItem, chip: QuickChipId): boolean {
  if (chip === "zero") return effectiveMonthlyPrice(item) === 0;
  if (chip === "under10k_lifetime") return isLifetimePromotion(item.promotion) && effectiveMonthlyPrice(item) <= 10000;
  if (chip === "skt") return item.extra.carrier_network === "SKT";
  if (chip === "kt") return item.extra.carrier_network === "KT";
  return item.extra.selected_count >= HOT_SELECTED_COUNT_THRESHOLD;
}

export function sortPlans(items: MobilePlanListItem[], sort: SortId): MobilePlanListItem[] {
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
