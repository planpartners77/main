"use client";

import { useState } from "react";
import {
  CALL_PRESETS,
  DISCOUNT_PERIODS,
  EMPTY_FILTER_STATE,
  PRICE_RANGES,
  SMS_PRESETS,
  matchesFilter,
  type MobileFilterState,
  type MobilePlanListItem,
} from "@/lib/mobile/filters";
import {
  CARRIER_NETWORKS,
  DEDICATED_TAGS,
  NETWORK_TECHS,
  PLAN_FEATURES,
  THROTTLE_SPEED_OPTIONS,
} from "@/lib/mobile/plan-spec";

const TABS = [
  { id: "throttle", label: "소진시속도" },
  { id: "call", label: "통화량" },
  { id: "price", label: "가격" },
  { id: "discount", label: "할인기간" },
  { id: "carrier", label: "통신정보" },
  { id: "bundle", label: "인터넷결합" },
  { id: "sms", label: "문자량" },
  { id: "features", label: "추가기능" },
  { id: "extra", label: "부가필터" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
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

export function MobileFilterModal({
  products,
  value,
  onApply,
  onClose,
}: {
  products: MobilePlanListItem[];
  value: MobileFilterState;
  onApply: (next: MobileFilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MobileFilterState>(value);
  const [tab, setTab] = useState<TabId>("throttle");

  const resultCount = products.filter((p) => matchesFilter(p, draft)).length;

  function set<K extends keyof MobileFilterState>(key: K, v: MobileFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: v }));
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
                  <Chip
                    key={opt.value}
                    active={draft.throttleSpeeds.includes(opt.value)}
                    onClick={() => set("throttleSpeeds", toggleInArray(draft.throttleSpeeds, opt.value))}
                  >
                    {opt.label}
                  </Chip>
                ))}
                <p className="mt-1 w-full text-xs text-gray-400">
                  {THROTTLE_SPEED_OPTIONS.find((o) => draft.throttleSpeeds.includes(o.value))?.helper ?? "데이터 소진 후 속도 제한 기준으로 골라보세요."}
                </p>
              </div>
            )}

            {tab === "call" && (
              <div className="flex flex-wrap gap-2">
                {CALL_PRESETS.map((opt) => (
                  <Chip
                    key={opt.id}
                    active={draft.callPresets.includes(opt.id)}
                    onClick={() => set("callPresets", toggleInArray(draft.callPresets, opt.id))}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            )}

            {tab === "price" && (
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((opt) => (
                  <Chip
                    key={opt.id}
                    active={draft.priceRanges.includes(opt.id)}
                    onClick={() => set("priceRanges", toggleInArray(draft.priceRanges, opt.id))}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            )}

            {tab === "discount" && (
              <div className="flex flex-wrap gap-2">
                {DISCOUNT_PERIODS.map((opt) => (
                  <Chip
                    key={opt.id}
                    active={draft.discountPeriods.includes(opt.id)}
                    onClick={() => set("discountPeriods", toggleInArray(draft.discountPeriods, opt.id))}
                  >
                    {opt.label}
                  </Chip>
                ))}
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

            {tab === "extra" && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500">핫스팟</p>
                  <label className="mt-2 flex items-center gap-2.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.hotspotOnly}
                      onChange={(e) => set("hotspotOnly", e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                    />
                    핫스팟(테더링) 제공 요금제만
                  </label>
                </div>
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
