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
  type MobilePlanExtraCost,
} from "@/lib/mobile/plan-spec";

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// 비정상 입력(NaN, 음수)이 그대로 extra jsonb에 저장되면 필터 비교에서 요금제가
// 조용히 안 보이는 등 눈에 띄지 않는 오류로 이어지므로, 유효하지 않은 값은
// 안전한 기본값(무제한=null / 0)으로 되돌린다.
function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function numberOrZero(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
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

  function addExtraCost() {
    set("extra_costs", [...value.extra_costs, { label: "", amount: 0 }]);
  }

  function updateExtraCost(index: number, patch: Partial<MobilePlanExtraCost>) {
    set(
      "extra_costs",
      value.extra_costs.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function removeExtraCost(index: number) {
    set(
      "extra_costs",
      value.extra_costs.filter((_, i) => i !== index),
    );
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
          min="0"
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
          min="0"
          value={value.call_minutes ?? ""}
          onChange={(e) => set("call_minutes", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        문자 제공량 (건, 비우면 무제한, 0=없음)
        <input
          type="number"
          min="0"
          value={value.sms_count ?? ""}
          onChange={(e) => set("sms_count", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        약정 개월 (0=무약정)
        <input
          type="number"
          min="0"
          value={value.contract_months}
          onChange={(e) => set("contract_months", numberOrZero(e.target.value))}
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
          min="0"
          value={value.hotspot_gb ?? ""}
          onChange={(e) => set("hotspot_gb", numberOrNull(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="text-sm">
        <p className="font-medium text-gray-700">누적 선택 수</p>
        <p className="mt-1 text-xs text-gray-400">
          실제 신청(leads) 건수를 기준으로 화면에 자동 표시돼요. 별도 입력은 필요 없습니다.
        </p>
      </div>

      <label className="text-sm sm:col-span-2">
        결합 혜택 설명 (선택, 예: 인터넷 결합 시 13,200원 할인)
        <input
          type="text"
          value={value.bundle_benefit ?? ""}
          onChange={(e) => set("bundle_benefit", e.target.value.trim() ? e.target.value : null)}
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

      <div className="text-sm sm:col-span-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-700">기타비용 (유심비, 가입비 등)</p>
          <button
            type="button"
            onClick={addExtraCost}
            className="rounded-full border border-[var(--brand-blue)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-blue)]"
          >
            + 항목 추가
          </button>
        </div>
        {value.extra_costs.length > 0 && (
          <div className="mt-2 space-y-2">
            {value.extra_costs.map((cost, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="항목명 (예: 유심비)"
                  value={cost.label}
                  onChange={(e) => updateExtraCost(i, { label: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="금액 (0=무료)"
                  value={cost.amount}
                  onChange={(e) => updateExtraCost(i, { amount: numberOrZero(e.target.value) })}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeExtraCost(i)}
                  className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-2 text-xs text-gray-500 hover:border-red-300 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
