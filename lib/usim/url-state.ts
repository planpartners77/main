// 필터/정렬/퀵칩 상태를 URL 쿼리스트링과 상호 변환한다.
// 뒤로가기·새로고침 시 화면 상태가 초기화되는 문제를 막기 위해 상태의 원천을 URL로 둔다.
import {
  DEFAULT_CALL_RANGE,
  DEFAULT_DISCOUNT_RANGE,
  DEFAULT_HOTSPOT_RANGE,
  DEFAULT_PRICE_RANGE,
  EMPTY_FILTER_STATE,
  type QuickChipId,
  type RangeValue,
  type SmsPresetId,
  type SortId,
  type UsimFilterState,
} from "./filters";
import type { CarrierNetwork, DedicatedTag, NetworkTech, PlanFeature, ThrottleSpeed } from "./plan-spec";

export interface UsimUrlState {
  filters: UsimFilterState;
  sort: SortId;
  chips: QuickChipId[];
}

function splitCsv(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

function parseRange(v: string | null, def: RangeValue): RangeValue {
  if (!v) return def;
  const [min, max] = v.split("-").map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return def;
  return { min, max };
}

function rangeParam(range: RangeValue, def: RangeValue): string | null {
  if (range.min === def.min && range.max === def.max) return null;
  return `${range.min}-${range.max}`;
}

export function paramsToState(params: URLSearchParams): UsimUrlState {
  const filters: UsimFilterState = {
    ...EMPTY_FILTER_STATE,
    dataUsage: (params.get("data") as UsimFilterState["dataUsage"]) || null,
    throttleSpeeds: splitCsv(params.get("throttle")) as ThrottleSpeed[],
    callRange: parseRange(params.get("call"), DEFAULT_CALL_RANGE),
    callUnlimitedOnly: params.get("callUnlimited") === "1",
    priceRange: parseRange(params.get("price"), DEFAULT_PRICE_RANGE),
    discountRange: parseRange(params.get("discount"), DEFAULT_DISCOUNT_RANGE),
    discountLifetimeOnly: params.get("discountLifetime") === "1",
    carrierNetworks: splitCsv(params.get("carrier")) as CarrierNetwork[],
    networkTechs: splitCsv(params.get("tech")) as NetworkTech[],
    partnerIds: splitCsv(params.get("partners")),
    internetBundleOnly: params.get("bundle") === "1",
    smsPresets: splitCsv(params.get("sms")) as SmsPresetId[],
    features: splitCsv(params.get("features")) as PlanFeature[],
    hotspotRange: parseRange(params.get("hotspot"), DEFAULT_HOTSPOT_RANGE),
    dedicatedTags: splitCsv(params.get("tags")) as DedicatedTag[],
    eligibilityMinor: params.get("minor") === "1",
    eligibilityForeigner: params.get("foreigner") === "1",
    paybackOnly: params.get("payback") === "1",
    search: params.get("q") ?? "",
  };

  return {
    filters,
    sort: (params.get("sort") as SortId) || "recommended",
    chips: splitCsv(params.get("chips")) as QuickChipId[],
  };
}

export function stateToParams(state: UsimUrlState): URLSearchParams {
  const { filters, sort, chips } = state;
  const params = new URLSearchParams();

  if (filters.dataUsage) params.set("data", filters.dataUsage);
  if (filters.throttleSpeeds.length) params.set("throttle", filters.throttleSpeeds.join(","));
  const callParam = rangeParam(filters.callRange, DEFAULT_CALL_RANGE);
  if (callParam) params.set("call", callParam);
  if (filters.callUnlimitedOnly) params.set("callUnlimited", "1");
  const priceParam = rangeParam(filters.priceRange, DEFAULT_PRICE_RANGE);
  if (priceParam) params.set("price", priceParam);
  const discountParam = rangeParam(filters.discountRange, DEFAULT_DISCOUNT_RANGE);
  if (discountParam) params.set("discount", discountParam);
  if (filters.discountLifetimeOnly) params.set("discountLifetime", "1");
  if (filters.carrierNetworks.length) params.set("carrier", filters.carrierNetworks.join(","));
  if (filters.networkTechs.length) params.set("tech", filters.networkTechs.join(","));
  if (filters.partnerIds.length) params.set("partners", filters.partnerIds.join(","));
  if (filters.internetBundleOnly) params.set("bundle", "1");
  if (filters.smsPresets.length) params.set("sms", filters.smsPresets.join(","));
  if (filters.features.length) params.set("features", filters.features.join(","));
  const hotspotParam = rangeParam(filters.hotspotRange, DEFAULT_HOTSPOT_RANGE);
  if (hotspotParam) params.set("hotspot", hotspotParam);
  if (filters.dedicatedTags.length) params.set("tags", filters.dedicatedTags.join(","));
  if (filters.eligibilityMinor) params.set("minor", "1");
  if (filters.eligibilityForeigner) params.set("foreigner", "1");
  if (filters.paybackOnly) params.set("payback", "1");
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (sort !== "recommended") params.set("sort", sort);
  if (chips.length) params.set("chips", chips.join(","));

  return params;
}
