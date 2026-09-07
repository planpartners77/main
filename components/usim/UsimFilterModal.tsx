"use client";

import { useMemo, useState } from "react";
import {
  CALL_PRESETS,
  CALL_SLIDER_MAX,
  DEFAULT_HOTSPOT_RANGE,
  DISCOUNT_PERIODS,
  DISCOUNT_SLIDER_MAX,
  EMPTY_FILTER_STATE,
  HOTSPOT_SLIDER_MAX,
  PRICE_RANGES,
  PRICE_SLIDER_MAX,
  SMS_PRESETS,
  matchesFilter,
  type RangeValue,
  type UsimFilterState,
  type UsimPlanListItem,
} from "@/lib/usim/filters";
import {
  CARRIER_NETWORKS,
  DEDICATED_TAGS,
  NETWORK_TECHS,
  PLAN_FEATURES,
  THROTTLE_SPEED_OPTIONS,
} from "@/lib/usim/plan-spec";
import { RangeSlider } from "./RangeSlider";

const TABS = [
  { id: "throttle", label: "소진시속도" },
  { id: "call", label: "통화량" },
  { id: "price", label: "가격" },
  { id: "discount", label: "할인기간" },
  { id: "carrier", label: "통신정보" },
  { id: "partner", label: "통신사(파트너)" },
  { id: "bundle", label: "인터넷결합" },
  { id: "sms", label: "문자량" },
  { id: "features", label: "추가기능" },
  { id: "hotspot", label: "핫스팟" },
  { id: "dedicated", label: "전용요금제" },
  { id: "eligibility", label: "가입대상" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function sameRange(a: RangeValue, b: RangeValue): boolean {
  return a.min === b.min && a.max === b.max;
}

function priceLabel(v: number): string {
  return v >= PRICE_SLIDER_MAX ? `${(v / 10000).toFixed(0)}만원 이상` : `${v.toLocaleString()}원`;
}

function callLabel(v: number): string {
  return v >= CALL_SLIDER_MAX ? `${v}분 이상` : `${v}분`;
}

function discountLabel(v: number): string {
  return v >= DISCOUNT_SLIDER_MAX ? `${v}개월 이상` : `${v}개월`;
}

function hotspotLabel(v: number): string {
  return v >= HOTSPOT_SLIDER_MAX ? `${v}GB 이상` : `${v}GB`;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-blue)]/50"
      }`}
    >
      {children}
    </button>
  );
}

function HelpIcon({ helper }: { helper: string }) {
  return (
    <span
      title={helper}
      className="ml-1 inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold leading-none text-gray-500"
    >
      ?
    </span>
  );
}

export function UsimFilterModal({
  products,
  value,
  onApply,
  onClose,
}: {
  products: UsimPlanListItem[];
  value: UsimFilterState;
  onApply: (next: UsimFilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<UsimFilterState>(value);
  const [tab, setTab] = useState<TabId>("throttle");

  const resultCount = products.filter((p) => matchesFilter(p, draft)).length;

  const partnerOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.partner_id) map.set(p.partner_id, p.partner_name ?? p.partner_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  function set<K extends keyof UsimFilterState>(key: K, v: UsimFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: v }));
  }

  function setMany(patch: Partial<UsimFilterState>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:h-[80vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-bold text-[var(--brand-navy)]">필터</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
            닫기
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="w-28 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50 py-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`block w-full px-3 py-2.5 text-left text-xs font-semibold ${
                  tab === t.id ? "bg-white text-[var(--brand-blue)]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-5">
            {tab === "throttle" && (
              <div className="flex flex-wrap gap-2">
                {THROTTLE_SPEED_OPTIONS.map((opt) => (
                  <span key={opt.value} className="inline-flex items-center">
                    <Chip
                      active={draft.throttleSpeeds.includes(opt.value)}
                      onClick={() => set("throttleSpeeds", toggleInArray(draft.throttleSpeeds, opt.value))}
                    >
                      {opt.label}
                    </Chip>
                    <HelpIcon helper={opt.helper} />
                  </span>
                ))}
                <p className="mt-1 w-full text-xs text-gray-400">
                  데이터 소진 후 속도 제한 기준으로 골라보세요. 각 옵션의 ? 아이콘에 마우스를 올리면 체감 속도를 알 수 있어요.
                </p>
              </div>
            )}

            {tab === "call" && (
              <div className="space-y-4">
                <RangeSlider
                  min={0}
                  max={CALL_SLIDER_MAX}
                  step={10}
                  value={draft.callUnlimitedOnly ? { min: 0, max: CALL_SLIDER_MAX } : draft.callRange}
                  onChange={(next) => setMany({ callRange: next, callUnlimitedOnly: false })}
                  formatValue={callLabel}
                />
                <div className="flex flex-wrap gap-2">
                  {CALL_PRESETS.map((opt) => (
                    <Chip
                      key={opt.id}
                      active={!draft.callUnlimitedOnly && sameRange(draft.callRange, { min: opt.min, max: opt.max })}
                      onClick={() => setMany({ callRange: { min: opt.min, max: opt.max }, callUnlimitedOnly: false })}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                  <Chip active={draft.callUnlimitedOnly} onClick={() => set("callUnlimitedOnly", !draft.callUnlimitedOnly)}>
                    무제한
                  </Chip>
                </div>
              </div>
            )}

            {tab === "price" && (
              <div className="space-y-4">
                <RangeSlider
                  min={0}
                  max={PRICE_SLIDER_MAX}
                  step={1000}
                  value={draft.priceRange}
                  onChange={(next) => set("priceRange", next)}
                  formatValue={priceLabel}
                />
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((opt) => (
                    <Chip
                      key={opt.id}
                      active={sameRange(draft.priceRange, { min: opt.min, max: opt.max })}
                      onClick={() => set("priceRange", { min: opt.min, max: opt.max })}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {tab === "discount" && (
              <div className="space-y-4">
                <RangeSlider
                  min={0}
                  max={DISCOUNT_SLIDER_MAX}
                  step={1}
                  value={draft.discountLifetimeOnly ? { min: 0, max: DISCOUNT_SLIDER_MAX } : draft.discountRange}
                  onChange={(next) => setMany({ discountRange: next, discountLifetimeOnly: false })}
                  formatValue={discountLabel}
                />
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_PERIODS.map((opt) => (
                    <Chip
                      key={opt.id}
                      active={!draft.discountLifetimeOnly && sameRange(draft.discountRange, { min: opt.min, max: opt.max })}
                      onClick={() => setMany({ discountRange: { min: opt.min, max: opt.max }, discountLifetimeOnly: false })}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                  <Chip
                    active={draft.discountLifetimeOnly}
                    onClick={() => set("discountLifetimeOnly", !draft.discountLifetimeOnly)}
                  >
                    평생
                  </Chip>
                </div>
              </div>
            )}

            {tab === "carrier" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">통신망</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CARRIER_NETWORKS.map((net) => (
                      <Chip
                        key={net}
                        active={draft.carrierNetworks.includes(net)}
                        onClick={() => set("carrierNetworks", toggleInArray(draft.carrierNetworks, net))}
                      >
                        {net}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">기술</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {NETWORK_TECHS.map((tech) => (
                      <Chip
                        key={tech}
                        active={draft.networkTechs.includes(tech)}
                        onClick={() => set("networkTechs", toggleInArray(draft.networkTechs, tech))}
                      >
                        {tech}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "partner" && (
              <div>
                <p className="text-xs font-semibold text-gray-500">통신사(파트너)</p>
                {partnerOptions.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-400">등록된 파트너 정보가 없어요.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {partnerOptions.map((p) => (
                      <Chip
                        key={p.id}
                        active={draft.partnerIds.includes(p.id)}
                        onClick={() => set("partnerIds", toggleInArray(draft.partnerIds, p.id))}
                      >
                        {p.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "bundle" && (
              <label className="flex items-center gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.internetBundleOnly}
                  onChange={(e) => set("internetBundleOnly", e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand-blue)]"
                />
                인터넷 결합 가능한 요금제만 보기
              </label>
            )}

            {tab === "sms" && (
              <div className="flex flex-wrap gap-2">
                {SMS_PRESETS.map((opt) => (
                  <Chip
                    key={opt.id}
                    active={draft.smsPresets.includes(opt.id)}
                    onClick={() => set("smsPresets", toggleInArray(draft.smsPresets, opt.id))}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            )}

            {tab === "features" && (
              <div className="flex flex-wrap gap-2">
                {PLAN_FEATURES.map((feat) => (
                  <Chip
                    key={feat}
                    active={draft.features.includes(feat)}
                    onClick={() => set("features", toggleInArray(draft.features, feat))}
                  >
                    {feat}
                  </Chip>
                ))}
              </div>
            )}

            {tab === "hotspot" && (
              <div className="space-y-4">
                <RangeSlider
                  min={0}
                  max={HOTSPOT_SLIDER_MAX}
                  step={5}
                  value={draft.hotspotRange}
                  onChange={(next) => set("hotspotRange", next)}
                  formatValue={hotspotLabel}
                />
                <Chip
                  active={draft.hotspotRange.min > 0}
                  onClick={() =>
                    set("hotspotRange", draft.hotspotRange.min > 0 ? DEFAULT_HOTSPOT_RANGE : { min: 1, max: HOTSPOT_SLIDER_MAX })
                  }
                >
                  핫스팟(테더링) 제공 요금제만
                </Chip>
              </div>
            )}

            {tab === "dedicated" && (
              <div>
                <p className="text-xs font-semibold text-gray-500">전용 요금제</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEDICATED_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      active={draft.dedicatedTags.includes(tag)}
                      onClick={() => set("dedicatedTags", toggleInArray(draft.dedicatedTags, tag))}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {tab === "eligibility" && (
              <div>
                <p className="text-xs font-semibold text-gray-500">가입 대상</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip active={draft.eligibilityMinor} onClick={() => set("eligibilityMinor", !draft.eligibilityMinor)}>
                    미성년자 가능
                  </Chip>
                  <Chip
                    active={draft.eligibilityForeigner}
                    onClick={() => set("eligibilityForeigner", !draft.eligibilityForeigner)}
                  >
                    외국인 가능
                  </Chip>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTER_STATE)}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
          >
            {resultCount}개 결과 보기
          </button>
        </div>
      </div>
    </div>
  );
}
