import type { Metadata } from "next";
import { getSelfServiceProductDetail } from "@/lib/products/self-service-detail-query";
import { SelfServiceProductDetailPage } from "@/components/shared/SelfServiceProductDetailPage";

// 진열 목록에서는 뺐지만 직접 링크로는 열어둔 상품(is_listed=false)은 검색엔진에는
// 노출하지 않는다 — 접근 자체는 계속 허용된다.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getSelfServiceProductDetail("rental", id);
  if (!item) return {};
  return item.is_listed ? {} : { robots: { index: false, follow: false } };
}

export default async function RentalProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SelfServiceProductDetailPage categorySlug="rental" listHref="/rental" id={id} />;
}
