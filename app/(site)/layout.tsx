import { GlobalNav } from "@/components/shared/GlobalNav";
import { Footer } from "@/components/shared/Footer";
import { SitePopupLayer } from "@/components/design/SitePopupLayer";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { getCategoryTree } from "@/lib/design/category-tree";

// 고객용 5개 카테고리 화면 전용 레이아웃. /admin은 이 그룹 밖에 있어 GNB/Footer를
// 공유하지 않는다 — 관리자페이지는 보안 경계가 다르다는 §9 원칙에 따른 구조.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategoryTree();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <GlobalNav categories={categories} />
      <div className="flex-1 pb-14 md:pb-0">{children}</div>
      <Footer />
      <SitePopupLayer />
      <ReferralCapture />
    </div>
  );
}
