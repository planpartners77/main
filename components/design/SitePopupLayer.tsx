import { headers } from "next/headers";
import { getActivePopups, getCategoryIdBySlug } from "@/lib/design/public-queries";
import { SitePopup } from "./SitePopup";

// 서버에서 노출 대상 팝업을 조회해 클라이언트 컴포넌트로 넘긴다 — 팝업이 없으면 렌더링 자체를 생략.
// 경로가 "/"면 메인페이지(audienceKey="home"), 첫 세그먼트가 카테고리 slug와 일치하면
// (예: /travel, /usim) 그 카테고리, 그 외(마이페이지 등)는 특정 대상 없음으로 판별한다
// (getActivePopups의 include/exclude 판정 기준이 되는 값 — 0048_popup_multi_target.sql).
export async function SitePopupLayer() {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/";
  const isHome = pathname === "/";
  const slug = pathname.split("/")[1] || null;
  const categoryId = !isHome && slug ? await getCategoryIdBySlug(slug) : null;

  const popups = await getActivePopups({ categoryId, isHome });
  if (popups.length === 0) return null;
  return <SitePopup popups={popups} />;
}
