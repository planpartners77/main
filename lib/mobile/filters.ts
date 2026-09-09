import {
  PHONE_CARRIERS,
  PHONE_MANUFACTURERS,
  type PhoneActivationType,
  type PhoneCarrier,
  type PhoneDeviceExtra,
  type PhoneManufacturer,
  type PhoneStorageGb,
} from "./device-spec";

export interface PhoneDeviceListItem {
  id: string;
  title: string;
  image_url: string | null;
  apply_url: string | null;
  base_price: number | null; // 완납가/일시불가
  incentive_min: number | null; // 비회원 노출용 지원금 하한
  incentive_max: number | null; // 비회원 노출용 지원금 상한
  incentive_exact: number | null; // 로그인 회원 전용 지원금 확정값
  extra: PhoneDeviceExtra;
  partner_id: string | null;
  partner_name: string | null;
  partner_logo_url: string | null;
}

// 지원금 확정값(로그인 회원)이 있으면 그 값으로, 없으면 상한값 기준으로 "최대 혜택가"를 계산한다.
export function bestEffectivePrice(item: PhoneDeviceListItem): number {
  const base = item.base_price ?? 0;
  const incentive = item.incentive_exact ?? item.incentive_max ?? item.incentive_min ?? 0;
  return Math.max(0, base - incentive);
}

export interface RangeValue {
  min: number;
  max: number;
}

export const PRICE_SLIDER_MAX = 1_500_000; // 150만원 이상은 최대값으로 취급
export const DEFAULT_PRICE_RANGE: RangeValue = { min: 0, max: PRICE_SLIDER_MAX };

export const PRICE_RANGES = [
  { id: "0-300000", label: "0~30만원", min: 0, max: 300_000 },
  { id: "300000-600000", label: "30~60만원", min: 300_000, max: 600_000 },
  { id: "600000-1000000", label: "60~100만원", min: 600_000, max: 1_000_000 },
  { id: "1000000+", label: "100만원 이상", min: 1_000_000, max: PRICE_SLIDER_MAX },
] as const;
export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export const SORT_OPTIONS = [
  { id: "recommended", label: "추천순" },
  { id: "price_asc", label: "혜택가 낮은순" },
  { id: "price_desc", label: "혜택가 높은순" },
  { id: "release_price_desc", label: "출고가 높은순" },
] as const;
export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export interface PhoneFilterState {
  manufacturers: PhoneManufacturer[];
  storageOptions: PhoneStorageGb[];
  carriers: PhoneCarrier[];
  activationTypes: PhoneActivationType[];
  selfProvidedOnly: boolean;
  priceRange: RangeValue;
  search: string;
}

export const EMPTY_FILTER_STATE: PhoneFilterState = {
  manufacturers: [],
  storageOptions: [],
  carriers: [],
  activationTypes: [],
  selfProvidedOnly: false,
  priceRange: DEFAULT_PRICE_RANGE,
  search: "",
};

function isRangeActive(range: RangeValue, def: RangeValue): boolean {
  return range.min !== def.min || range.max !== def.max;
}

export function activeFilterCount(f: PhoneFilterState): number {
  let n = 0;
  n += f.manufacturers.length;
  n += f.storageOptions.length;
  n += f.carriers.length;
  n += f.activationTypes.length;
  if (f.selfProvidedOnly) n++;
  if (isRangeActive(f.priceRange, DEFAULT_PRICE_RANGE)) n++;
  return n;
}

export function matchesFilter(item: PhoneDeviceListItem, f: PhoneFilterState): boolean {
  const e = item.extra;

  if (f.manufacturers.length > 0 && !f.manufacturers.includes(e.manufacturer)) return false;
  if (f.storageOptions.length > 0 && !f.storageOptions.includes(e.storage_gb)) return false;
  if (f.carriers.length > 0 && !f.carriers.some((c) => e.carriers.includes(c))) return false;
  if (f.activationTypes.length > 0 && !f.activationTypes.some((a) => e.activation_types.includes(a))) return false;
  if (f.selfProvidedOnly && !e.self_provided_available) return false;

  if (isRangeActive(f.priceRange, DEFAULT_PRICE_RANGE)) {
    const price = bestEffectivePrice(item);
    const max = f.priceRange.max >= PRICE_SLIDER_MAX ? Infinity : f.priceRange.max;
    if (price < f.priceRange.min || price > max) return false;
  }

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = `${item.title} ${e.model} ${item.partner_name ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function sortDevices(items: PhoneDeviceListItem[], sort: SortId): PhoneDeviceListItem[] {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => bestEffectivePrice(a) - bestEffectivePrice(b));
    case "price_desc":
      return arr.sort((a, b) => bestEffectivePrice(b) - bestEffectivePrice(a));
    case "release_price_desc":
      return arr.sort((a, b) => (b.extra.release_price ?? 0) - (a.extra.release_price ?? 0));
    case "recommended":
    default:
      return arr.sort((a, b) => {
        const aInStock = a.extra.stock_status === "sold_out" ? 1 : 0;
        const bInStock = b.extra.stock_status === "sold_out" ? 1 : 0;
        if (aInStock !== bInStock) return aInStock - bInStock;
        return bestEffectivePrice(a) - bestEffectivePrice(b);
      });
  }
}

export { PHONE_MANUFACTURERS, PHONE_CARRIERS };
