"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SeoSettings } from "@/lib/design/site-settings";

export function SeoSettingsManager({ settings }: { settings: SeoSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({
        value: {
          googleSiteVerification: form.googleSiteVerification?.trim() || null,
          naverSiteVerification: form.naverSiteVerification?.trim() || null,
          metaDescription: form.metaDescription?.trim() || null,
          indexable: form.indexable,
        },
      })
      .eq("key", "seo");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">
          구글 사이트 소유확인 코드 (google-site-verification)
        </label>
        <input
          value={form.googleSiteVerification ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, googleSiteVerification: e.target.value }))}
          placeholder="예: AbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Search Console에서 발급받은 HTML 태그의 content=&quot;...&quot; 안쪽 값만 붙여넣으세요.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">
          네이버 사이트 소유확인 코드 (naver-site-verification)
        </label>
        <input
          value={form.naverSiteVerification ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, naverSiteVerification: e.target.value }))}
          placeholder="예: 1234567890abcdefghij1234567890abcdefghij"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          네이버 서치어드바이저에서 발급받은 HTML 태그의 content=&quot;...&quot; 안쪽 값만 붙여넣으세요.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">검색결과 노출용 사이트 설명</label>
        <textarea
          value={form.metaDescription ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
          placeholder="인터넷·휴대폰·가전렌탈·보험·상조를 비교해드리는 비교·중개 전문 플랫폼"
          rows={3}
          maxLength={160}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          검색결과 목록에서 제목 아래 표시되는 요약 문구입니다. 비워두면 기본 문구가 사용됩니다.
          (권장 60~160자, 현재 {form.metaDescription?.length ?? 0}자)
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--brand-navy)]">
          <input
            type="checkbox"
            checked={form.indexable}
            onChange={(e) => setForm((prev) => ({ ...prev, indexable: e.target.checked }))}
          />
          검색엔진 노출 허용 (indexable)
        </label>
        <p className="mt-1.5 text-xs text-gray-500">
          체크를 끄면 robots.txt와 페이지 메타태그가 즉시 전체 크롤링 차단으로 바뀌어, 이미 색인된
          페이지도 검색결과에서 서서히 제외됩니다. 오픈 전 임시 비공개나 장애 대응 등 특별한
          경우가 아니라면 반드시 켜두세요.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-green-600">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
