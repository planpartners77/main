import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/design/PageRenderer";
import { getPublishedPageWithSections } from "@/lib/design/pages-query";

// 관리자 "디자인관리 > 페이지"에서 만든, 홈 이외의 페이지(이벤트 랜딩 등)가 실제로 열리는 공개 라우트.
// slug='home'은 루트(/)가 이미 전담하므로 여기서는 그 외 슬러그만 의미가 있다.
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "home") notFound();

  const page = await getPublishedPageWithSections(slug);
  if (!page) notFound();

  return <PageRenderer sections={page.sections} />;
}
