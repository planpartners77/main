import { getActivePopups } from "@/lib/design/public-queries";
import { SitePopup } from "./SitePopup";

// 서버에서 노출 대상 팝업을 조회해 클라이언트 컴포넌트로 넘긴다 — 팝업이 없으면 렌더링 자체를 생략.
export async function SitePopupLayer() {
  const popups = await getActivePopups();
  if (popups.length === 0) return null;
  return <SitePopup popups={popups} />;
}
