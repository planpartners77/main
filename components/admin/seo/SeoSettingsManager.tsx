"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SeoSettings } from "@/lib/design/site-settings";

const ASSET_BUCKET = "design-assets";
const FAVICON_MAX_SIZE = 1024 * 1024;
const FAVICON_ACCEPTED_TYPES = ["image/png"];
const OG_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const OG_IMAGE_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function SeoSettingsManager({ settings }: { settings: SeoSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [ogImageUploading, setOgImageUploading] = useState(false);
  const [ogImageError, setOgImageError] = useState<string | null>(null);

  async function handleFaviconUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!FAVICON_ACCEPTED_TYPES.includes(file.type)) {
      setFaviconError("png 파일만 업로드할 수 있습니다. (정사각형, 512x512 권장)");
      return;
    }
    if (file.size > FAVICON_MAX_SIZE) {
      setFaviconError("1MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }

    setFaviconError(null);
    setFaviconUploading(true);
    const supabase = createClient();
    const path = `favicon-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage.from(ASSET_BUCKET).upload(path, file);
    setFaviconUploading(false);
    if (uploadError) {
      setFaviconError(`업로드 실패: ${uploadError.message}`);
      return;
    }

    const publicUrl = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
    setForm((prev) => ({ ...prev, faviconUrl: publicUrl }));
    setSaved(false);
  }

  async function handleOgImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!OG_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      setOgImageError("png, jpg, webp 파일만 업로드할 수 있습니다. (1200x630 권장)");
      return;
    }
    if (file.size > OG_IMAGE_MAX_SIZE) {
      setOgImageError("5MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }

    setOgImageError(null);
    setOgImageUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `og-image-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(ASSET_BUCKET).upload(path, file);
    setOgImageUploading(false);
    if (uploadError) {
      setOgImageError(`업로드 실패: ${uploadError.message}`);
      return;
    }

    const publicUrl = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
    setForm((prev) => ({ ...prev, ogImageUrl: publicUrl }));
    setSaved(false);
  }

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
          faviconUrl: form.faviconUrl || null,
          ogImageUrl: form.ogImageUrl || null,
          siteTitle: form.siteTitle?.trim() || null,
          headScript: form.headScript?.trim() || null,
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
          사이트 타이틀 (브라우저 탭 · 검색결과 제목)
        </label>
        <input
          value={form.siteTitle ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, siteTitle: e.target.value }))}
          placeholder="플랜파트너스"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">비워두면 기본 타이틀 &quot;플랜파트너스&quot;가 사용됩니다.</p>
      </div>

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
        <label className="text-sm font-medium text-[var(--brand-navy)]">파비콘 (브라우저 탭 아이콘)</label>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element -- Storage 이미지, next/image 미사용 프로젝트 컨벤션(unoptimized) */}
            <img
              src={form.faviconUrl || "/favicon.ico"}
              alt="파비콘 미리보기"
              className="h-full w-full object-contain"
            />
          </div>
          <label className="cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            {faviconUploading ? "업로드 중..." : "이미지 업로드"}
            <input
              type="file"
              accept={FAVICON_ACCEPTED_TYPES.join(",")}
              onChange={handleFaviconUpload}
              disabled={faviconUploading}
              className="hidden"
            />
          </label>
          {form.faviconUrl && (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, faviconUrl: null }))}
              className="text-xs font-semibold text-gray-500 hover:text-red-500"
            >
              기본값으로 되돌리기
            </button>
          )}
        </div>
        {faviconError && <p className="mt-1.5 text-xs text-red-600">{faviconError}</p>}
        <p className="mt-1.5 text-xs text-gray-500">
          png 파일만 업로드할 수 있습니다. (정사각형, 512x512 권장 · 1MB 이하) 업로드 후 아래
          &quot;저장&quot;을 눌러야 실제 사이트에 반영됩니다.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">
          공유 이미지 (카카오톡·문자·SNS 링크 공유 시 노출)
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element -- Storage 이미지, next/image 미사용 프로젝트 컨벤션(unoptimized) */}
            <img
              src={form.ogImageUrl || "/images/logo.jpg"}
              alt="공유 이미지 미리보기"
              className="h-full w-full object-cover"
            />
          </div>
          <label className="cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            {ogImageUploading ? "업로드 중..." : "이미지 업로드"}
            <input
              type="file"
              accept={OG_IMAGE_ACCEPTED_TYPES.join(",")}
              onChange={handleOgImageUpload}
              disabled={ogImageUploading}
              className="hidden"
            />
          </label>
          {form.ogImageUrl && (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, ogImageUrl: null }))}
              className="text-xs font-semibold text-gray-500 hover:text-red-500"
            >
              기본값으로 되돌리기
            </button>
          )}
        </div>
        {ogImageError && <p className="mt-1.5 text-xs text-red-600">{ogImageError}</p>}
        <p className="mt-1.5 text-xs text-gray-500">
          png/jpg/webp만 업로드할 수 있습니다. (가로 1200 x 세로 630 권장 · 5MB 이하) 업로드 후
          아래 &quot;저장&quot;을 눌러야 실제 공유 시 반영됩니다.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">검색결과 노출용 사이트 설명</label>
        <textarea
          value={form.metaDescription ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
          placeholder="인터넷·유심·가전렌탈·보험·상조를 비교해드리는 비교·중개 전문 플랫폼"
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
        <label className="text-sm font-medium text-[var(--brand-navy)]">
          마케팅 스크립트 (GA4 · 메타/카카오 픽셀 등)
        </label>
        <textarea
          value={form.headScript ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, headScript: e.target.value }))}
          placeholder={'<script src="https://..."></script>\n<script>\n  ...\n</script>'}
          rows={6}
          spellCheck={false}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          각 서비스에서 발급받은 &lt;script&gt; 코드를 그대로 붙여넣으세요. 페이지가 로드된 뒤
          실행되며, 사이트 소유확인용 메타태그는 여기가 아니라 위 구글/네이버 인증 코드
          입력란을 사용해야 합니다.
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
      {saved && !error && <p className="text-sm text-[var(--brand-mint)]">저장되었습니다.</p>}

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
