"use client";

import { EMPTY_LANDING_PAGE_EXTRA, normalizeLandingPageExtra, type LandingPageExtra } from "@/lib/landing/page-spec";

export function parseLandingExtra(raw: string): LandingPageExtra {
  if (!raw.trim()) return { ...EMPTY_LANDING_PAGE_EXTRA };
  try {
    return normalizeLandingPageExtra(JSON.parse(raw));
  } catch {
    return { ...EMPTY_LANDING_PAGE_EXTRA };
  }
}

export function LandingPageSpecFields({
  value,
  onChange,
}: {
  value: LandingPageExtra;
  onChange: (next: LandingPageExtra) => void;
}) {
  return (
    <div className="col-span-1 grid gap-2 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4 sm:col-span-2">
      <p className="text-xs font-bold text-[var(--brand-blue-dark)]">랜딩페이지 상세 콘텐츠</p>
      <label className="text-sm">
        상세페이지 HTML (이미지는 미디어 라이브러리에서 업로드 후 URL을 &lt;img&gt; 태그에 붙여넣으세요)
        <textarea
          value={value.detail_html}
          onChange={(e) => onChange({ detail_html: e.target.value })}
          rows={12}
          spellCheck={false}
          placeholder={'<h2>제목</h2>\n<p>내용...</p>\n<img src="https://.../media.jpg" />'}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
        />
      </label>
      <p className="text-xs text-amber-600">
        관리자만 입력 가능한 영역이며 입력한 HTML/스크립트가 그대로 노출됩니다(별도 검증 없음). 신뢰할 수 없는 코드는
        붙여넣지 마세요.
      </p>
    </div>
  );
}
