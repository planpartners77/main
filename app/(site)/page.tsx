import { Hero } from "@/components/home/Hero";
import { CategoryQuickNav } from "@/components/home/CategoryQuickNav";
import { IncentiveBanner } from "@/components/home/IncentiveBanner";
import { TrustPoints } from "@/components/home/TrustPoints";
import { ReviewsSection, type ReviewCategoryOption, type ReviewRow } from "@/components/home/ReviewsSection";
import { PopularProducts } from "@/components/home/PopularProducts";
import { WhyPossible } from "@/components/home/WhyPossible";
import { BottomCta } from "@/components/home/BottomCta";
import { BannerStrip } from "@/components/design/BannerStrip";
import { getActiveBanners } from "@/lib/design/public-queries";
import { getHomePageSettings } from "@/lib/design/site-settings";
import { getCategoryTree } from "@/lib/design/category-tree";
import { createClient } from "@/lib/supabase/server";

// 아정당(ajd.co.kr) 랜딩 페이지의 섹션 구성을 참고해 레이아웃을 구성하되, 문구/색상/수치는
// 플랜파트너스 고유의 것으로 새로 작성했다(§12-3). 히어로 카피/섹션 on-off/카테고리 순서는
// 관리자 "페이지관리"·"카테고리관리" 화면에서 편집 가능하다.
export default async function Home() {
  const supabase = await createClient();
  const [banners, categories, homePage, { data: reviewCategories }, { data: reviews }] = await Promise.all([
    getActiveBanners(null),
    getCategoryTree(),
    getHomePageSettings(),
    supabase.from("categories").select("id, slug, name").is("parent_id", null).eq("is_active", true).order("sort_order"),
    supabase.from("reviews").select("id, category_id, author_label, rating, body").eq("is_active", true),
  ]);
  const { sections } = homePage;

  return (
    <>
      <Hero tagline={homePage.heroTagline} headline={homePage.heroHeadline} subcopy={homePage.heroSubcopy} />
      <BannerStrip banners={banners} />
      <CategoryQuickNav categories={categories} />
      {sections.incentive && <IncentiveBanner />}
      {sections.trust && <TrustPoints />}
      {sections.reviews && (
        <ReviewsSection
          categories={(reviewCategories ?? []) as ReviewCategoryOption[]}
          reviews={(reviews ?? []) as ReviewRow[]}
        />
      )}
      {sections.popular && <PopularProducts categories={categories} />}
      {sections.why && <WhyPossible />}
      {sections.cta && <BottomCta />}
    </>
  );
}
