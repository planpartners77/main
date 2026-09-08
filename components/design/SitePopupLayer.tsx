import { headers } from "next/headers";
import { getActivePopups, getCategoryIdBySlug } from "@/lib/design/public-queries";
import { SitePopup } from "./SitePopup";

// 서버에서 노출 대상 팝업을 조회해 클라이언트 컴포넌트로 넘긴다 — 팝업이 없으면 렌더링 자체를 생략.
// 경로 첫 세그먼트가 카테고리 slug와 일치하면(예: /travel, /usim) 그 카테고리 전용 팝업만,
// 아니면(홈/마이페이지 등) 사이트 전체 팝업만 보여준다(banners.category_id와 동일한 노출 범위 규칙).
export async function SitePopupLayer() {
  const headerList = await headers();
  const slug = headerList.get("x-pathname")?.split("/")[1] || null;
  const categoryId = slug ? await getCategoryIdBySlug(slug) : null;

  const popups = await getActivePopups(categoryId);
  if (popups.length === 0) return null;
  return <SitePopup popups={popups} />;
}
