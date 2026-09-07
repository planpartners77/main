// 필터/정렬/퀵칩 상태를 URL 쿼리스트링과 상호 변환한다.
// 뒤로가기·새로고침 시 화면 상태가 초기화되는 문제를 막기 위해 상태의 원천을 URL로 둔다.
import {
  EMPTY_FILTER_STATE,
  type CallPresetId,
  type DiscountPeriodId,
  type UsimFilterState,
  type PriceRangeId,
  type QuickChipId,
  type SmsPresetId,
  type SortId,
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

export function paramsToState(params: URLSearchParams): UsimUrlState {
  const filters: UsimFilterState = {
    ...EMPTY_FILTER_STATE,
    dataUsage: (params.get("data") as UsimFilterState["dataUsage"]) || null,
    throttleSpeeds: splitCsv(params.get("throttle")) as ThrottleSpeed[],
    callPresets: splitCsv(params.get("call")) as CallPresetId[],
    priceRanges: splitCsv(params.get("price")) as PriceRangeId[],
    discountPeriods: splitCsv(params.get("discount")) as DiscountPeriodId[],
    carrierNetworks: splitCsv(params.get("carrier")) as CarrierNetwork[],
    networkTechs: splitCsv(params.get("tech")) as NetworkTech[],
    internetBundleOnly: params.get("bundle") === "1",
    smsPresets: splitCsv(params.get("sms")) as SmsPresetId[],
    features: splitCsv(params.get("features")) as PlanFeature[],
    hotspotOnly: params.get("hotspot") === "1",
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
  if (filters.callPresets.length) params.set("call", filters.callPresets.join(","));
  if (filters.priceRanges.length) params.set("price", filters.priceRanges.join(","));
  if (filters.discountPeriods.length) params.set("discount", filters.discountPeriods.join(","));
  if (filters.carrierNetworks.length) params.set("carrier", filters.carrierNetworks.join(","));
  if (filters.networkTechs.length) params.set("tech", filters.networkTechs.join(","));
  if (filters.internetBundleOnly) params.set("bundle", "1");
  if (filters.smsPresets.length) params.set("sms", filters.smsPresets.join(","));
  if (filters.features.length) params.set("features", filters.features.join(","));
  if (filters.hotspotOnly) params.set("hotspot", "1");
  if (filters.dedicatedTags.length) params.set("tags", filters.dedicatedTags.join(","));
  if (filters.eligibilityMinor) params.set("minor", "1");
  if (filters.eligibilityForeigner) params.set("foreigner", "1");
  if (filters.paybackOnly) params.set("payback", "1");
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (sort !== "recommended") params.set("sort", sort);
  if (chips.length) params.set("chips", chips.join(","));

  return params;
}
