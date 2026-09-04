import { PageRenderer } from "@/components/design/PageRenderer";
import { getPublishedPageWithSections } from "@/lib/design/pages-query";

// 아정당(ajd.co.kr) 랜딩 페이지의 섹션 구성을 참고해 레이아웃을 구성하되, 문구/색상/수치는
// 플랜파트너스 고유의 것으로 새로 작성했다(§12-3). 섹션 구성/순서/카피는 이제 관리자
// "디자인관리 > 페이지" 화면에서 slug='home' 페이지를 편집해 조정한다(pages/page_sections 테이블).
export default async function Home() {
  const homePage = await getPublishedPageWithSections("home");
  if (!homePage) return null;

  return <PageRenderer sections={homePage.sections} />;
}
