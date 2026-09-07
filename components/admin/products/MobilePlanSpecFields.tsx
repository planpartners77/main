"use client";

import {
  CARRIER_NETWORKS,
  DEDICATED_TAGS,
  EMPTY_MOBILE_PLAN_EXTRA,
  NETWORK_TECHS,
  PLAN_FEATURES,
  SIM_TYPES,
  THROTTLE_SPEED_OPTIONS,
  normalizeMobilePlanExtra,
  type MobilePlanExtra,
} from "@/lib/mobile/plan-spec";

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function numberOrNull(raw: string): number | null {
  return raw.trim() === "" ? null : Number(raw);
}

export function parseMobileExtra(raw: string): MobilePlanExtra {
  if (!raw.trim()) return { ...EMPTY_MOBILE_PLAN_EXTRA };
  try {
    return normalizeMobilePlanExtra(JSON.parse(raw));
  } catch {
    return { ...EMPTY_MOBILE_PLAN_EXTRA };
  }
}

export function MobilePlanSpecFields({
  value,
  onChange,
}: {
  value: MobilePlanExtra;
  onChange: (next: MobilePlanExtra) => void;
}) {
  function set<K extends keyof MobilePlanExtra>(key: K, v: MobilePlanExtra[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="col-span-1 grid gap-3 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4 sm:col-span-2 sm:grid-cols-2">
      <p className="text-xs font-bold text-[var(--brand-blue-dark)] sm:col-span-2">휴대폰 요금제 상세 스펙</p>

      <label className="text-sm">
        통신망
        <select
          value={value.carrier_network}
          onChange={(e) => set("carrier_network", e.target.value as MobilePlanExtra["carrier_network"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {CARRIER_NETWORKS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        네트워크 세대
        <select
          value={value.network_tech}
          onChange={(e) => set("network_tech", e.target.value as MobilePlanExtra["network_tech"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {NETWORK_TECHS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        데이터 제공량 (GB, 비우면 무제한)
        <input
          type="number"
          value={value.data_gb ?? ""}
          onChange={(e) => set("data_gb", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        소진 후 속도 제한
        <select
          value={value.data_throttle_speed}
          onChange={(e) => set("data_throttle_speed", e.target.value as MobilePlanExtra["data_throttle_speed"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {THROTTLE_SPEED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        통화 제공량 (분, 비우면 무제한, 0=없음)
        <input
          type="number"
          value={value.call_minutes ?? ""}
          onChange={(e) => set("call_minutes", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        문자 제공량 (건, 비우면 무제한, 0=없음)
        <input
          type="number"
          value={value.sms_count ?? ""}
          onChange={(e) => set("sms_count", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        약정 개월 (0=무약정)
        <input
          type="number"
          value={value.contract_months}
          onChange={(e) => set("contract_months", Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        유심 타입
        <select
          value={value.sim_type}
          onChange={(e) => set("sim_type", e.target.value as MobilePlanExtra["sim_type"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {SIM_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        핫스팟 제공량 (GB, 미제공 시 비움)
        <input
          type="number"
          value={value.hotspot_gb ?? ""}
          onChange={(e) => set("hotspot_gb", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        누적 선택 수 (표시용)
        <input
          type="number"
          value={value.selected_count}
          onChange={(e) => set("selected_count", Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-4 self-end text-sm sm:col-span-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.internet_bundle}
            onChange={(e) => set("internet_bundle", e.target.checked)}
          />
          인터넷 결합 가능
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.eligibility_minor}
            onChange={(e) => set("eligibility_minor", e.target.checked)}
          />
          미성년자 가입 가능
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.eligibility_foreigner}
            onChange={(e) => set("eligibility_foreigner", e.target.checked)}
          />
          외국인 가입 가능
        </label>
      </div>

      <div className="text-sm sm:col-span-2">
        <p className="mb-1.5 font-medium text-gray-700">전용 요금제 태그</p>
        <div className="flex flex-wrap gap-1.5">
          {DEDICATED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => set("tags", toggleInArray(value.tags, tag))}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                value.tags.includes(tag)
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm sm:col-span-2">
        <p className="mb-1.5 font-medium text-gray-700">지원 서비스</p>
        <div className="flex flex-wrap gap-1.5">
          {PLAN_FEATURES.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => set("features", toggleInArray(value.features, feature))}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                value.features.includes(feature)
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
