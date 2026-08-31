import { Hero } from "@/components/home/Hero";
import { CategoryQuickNav } from "@/components/home/CategoryQuickNav";
import { IncentiveBanner } from "@/components/home/IncentiveBanner";
import { TrustPoints } from "@/components/home/TrustPoints";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { PopularProducts } from "@/components/home/PopularProducts";
import { WhyPossible } from "@/components/home/WhyPossible";
import { BottomCta } from "@/components/home/BottomCta";
import { BannerStrip } from "@/components/design/BannerStrip";
import { getActiveBanners } from "@/lib/design/public-queries";
import { getCategoryOrder, getHomePageSettings } from "@/lib/design/site-settings";
import { getOrderedCategories } from "@/lib/categories";

// 아정당(ajd.co.kr) 랜딩 페이지의 섹션 구성을 참고해 레이아웃을 구성하되, 문구/색상/수치는
// 플랜파트너스 고유의 것으로 새로 작성했다(§12-3). 히어로 카피/섹션 on-off/카테고리 순서는
// 관리자 "페이지관리"·"카테고리 진열" 화면(site_settings)에서 편집 가능하다.
export default async function Home() {
  const [banners, categoryOrder, homePage] = await Promise.all([
    getActiveBanners(null),
    getCategoryOrder(),
    getHomePageSettings(),
  ]);
  const categories = getOrderedCategories(categoryOrder);
  const { sections } = homePage;

  return (
    <>
      <Hero tagline={homePage.heroTagline} headline={homePage.heroHeadline} subcopy={homePage.heroSubcopy} />
      <BannerStrip banners={banners} />
      <CategoryQuickNav categories={categories} />
      {sections.incentive && <IncentiveBanner />}
      {sections.trust && <TrustPoints />}
      {sections.reviews && <ReviewsSection />}
      {sections.popular && <PopularProducts />}
      {sections.why && <WhyPossible />}
      {sections.cta && <BottomCta />}
    </>
  );
}
