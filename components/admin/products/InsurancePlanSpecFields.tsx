"use client";

import {
  normalizeInsurancePlanExtra,
  type InsurancePlanExtra,
} from "@/lib/insurance/plan-spec";

export function parseInsuranceExtra(json: string): InsurancePlanExtra {
  try {
    return normalizeInsurancePlanExtra(JSON.parse(json));
  } catch {
    return normalizeInsurancePlanExtra(null);
  }
}

export function InsurancePlanSpecFields({
  value,
  onChange,
}: {
  value: InsurancePlanExtra;
  onChange: (next: InsurancePlanExtra) => void;
}) {
  function set<K extends keyof InsurancePlanExtra>(key: K, v: InsurancePlanExtra[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:col-span-2 sm:grid-cols-2">
      <p className="text-xs font-bold text-gray-500 sm:col-span-2">보험 플랜 정보</p>

      <label className="text-sm">
        보험사
        <input
          value={value.insurer}
          onChange={(e) => set("insurer", e.target.value)}
          placeholder="예: 삼성화재"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        월 보험료 (표기용)
        <input
          value={value.monthly_premium}
          onChange={(e) => set("monthly_premium", e.target.value)}
          placeholder="예: 3만원대~"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm sm:col-span-2">
        보장 요약
        <textarea
          value={value.coverage_summary}
          onChange={(e) => set("coverage_summary", e.target.value)}
          rows={3}
          placeholder="예: 사망·후유장해, 입원비, 수술비 보장"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
