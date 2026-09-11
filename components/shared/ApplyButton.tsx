"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getStoredReferral, getStoredUtm } from "@/lib/referral/client";

// "신청하기" 클릭 이력을 남긴다. apply_url(외부 제휴사 링크)이 있으면 새 탭으로 열려 원래
// 페이지가 끊기지 않고, 없으면 Next.js 클라이언트 라우팅이라 요청이 끊기지 않는다 — 두 경우
// 모두 페이지 이동을 막지 않고 비동기로 기록해도 안전하다. 실패해도 이동 자체는 막지 않는다.
async function recordApplyClick({
  categorySlug,
  productId,
  targetUrl,
}: {
  categorySlug: string;
  productId: string;
  targetUrl: string;
}) {
  try {
    const supabase = createClient();
    const [{ data: category }, { data: userData }] = await Promise.all([
      supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle(),
      supabase.auth.getUser(),
    ]);
    const referral = getStoredReferral();
    const utm = getStoredUtm();
    await supabase.from("apply_clicks").insert({
      category_id: category?.id ?? null,
      product_id: productId,
      user_id: userData.user?.id ?? null,
      target_url: targetUrl,
      referral_code_id: referral?.codeId ?? null,
      referrer_url: typeof window !== "undefined" ? window.location.href : null,
      utm_source: utm?.utm_source ?? null,
      utm_medium: utm?.utm_medium ?? null,
      utm_campaign: utm?.utm_campaign ?? null,
    });
  } catch {
    // 클릭 이력 저장 실패가 신청 자체를 막을 이유는 아니므로 무시
  }
}

export function ApplyButton({
  categorySlug,
  productId,
  applyUrl,
  internalHref,
  className,
}: {
  categorySlug: string;
  productId: string;
  applyUrl: string | null;
  internalHref: string;
  className: string;
}) {
  if (applyUrl) {
    return (
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => recordApplyClick({ categorySlug, productId, targetUrl: applyUrl })}
      >
        신청하기
      </a>
    );
  }

  return (
    <Link
      href={internalHref}
      className={className}
      onClick={() => recordApplyClick({ categorySlug, productId, targetUrl: internalHref })}
    >
      신청하기
    </Link>
  );
}
