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
        보장 요약 (목록 카드에 짧게 노출)
        <textarea
          value={value.coverage_summary}
          onChange={(e) => set("coverage_summary", e.target.value)}
          rows={3}
          placeholder="예: 사망·후유장해, 입원비, 수술비 보장"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-2 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4 sm:col-span-2">
        <p className="text-xs font-bold text-[var(--brand-blue-dark)]">상세페이지 콘텐츠</p>
        <label className="text-sm">
          상세페이지 HTML (이미지는 미디어 라이브러리에서 업로드 후 URL을 &lt;img&gt; 태그에 붙여넣으세요)
          <textarea
            value={value.detail_html}
            onChange={(e) => set("detail_html", e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={'<h2>보장 내용</h2>\n<p>...</p>'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
          />
        </label>
        <p className="text-xs text-amber-600">
          관리자만 입력 가능한 영역이며 입력한 HTML/스크립트가 그대로 노출됩니다(별도 검증 없음). 신뢰할 수 없는 코드는
          붙여넣지 마세요. 비워두면 보장 요약으로 대체 표시됩니다.
        </p>
      </div>
    </div>
  );
}
