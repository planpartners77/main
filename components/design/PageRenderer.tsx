import { Hero } from "@/components/home/Hero";
import { CategoryQuickNav } from "@/components/home/CategoryQuickNav";
import { IncentiveBanner } from "@/components/home/IncentiveBanner";
import { TrustPoints } from "@/components/home/TrustPoints";
import { ReviewsSection, type ReviewCategoryOption, type ReviewRow } from "@/components/home/ReviewsSection";
import { WhyPossible } from "@/components/home/WhyPossible";
import { BottomCta } from "@/components/home/BottomCta";
import { BannerStrip } from "@/components/design/BannerStrip";
import { ProductDisplaySection } from "@/components/design/ProductDisplaySection";
import { RichTextSection } from "@/components/design/RichTextSection";
import { NoticeListSection } from "@/components/design/NoticeListSection";
import { getActiveBanners } from "@/lib/design/public-queries";
import { getCategoryTree } from "@/lib/design/category-tree";
import { getProductDisplayData } from "@/lib/design/products-query";
import { createClient } from "@/lib/supabase/server";
import type { PageSectionRow } from "@/lib/design/pages-query";
import type {
  HeroSectionConfig,
  ProductDisplayConfig,
  RichTextConfig,
  NoticeListConfig,
} from "@/lib/design/page-sections";

// 섹션 타입 -> 실제 렌더 컴포넌트 매핑. app/(site)/page.tsx가 하드코딩된 조건부 렌더 목록
// ({sections.incentive && <IncentiveBanner/>} 방식)을 쓰던 것을, pages/page_sections 테이블에서
// 내려온 목록을 그대로 순회하는 방식으로 대체한다 — 새 섹션 타입은 여기 case 하나만 늘리면 된다.
async function Section({ section, isLoggedIn }: { section: PageSectionRow; isLoggedIn: boolean }) {
  switch (section.type) {
    case "hero": {
      const config = section.config as Partial<HeroSectionConfig>;
      return (
        <Hero
          tagline={config.tagline || undefined}
          headline={config.headline || undefined}
          subcopy={config.subcopy || undefined}
        />
      );
    }
    case "banner_strip": {
      const banners = await getActiveBanners(null);
      return <BannerStrip banners={banners} />;
    }
    case "category_nav": {
      const categories = await getCategoryTree();
      return <CategoryQuickNav categories={categories} />;
    }
    case "incentive":
      return <IncentiveBanner />;
    case "trust_points":
      return <TrustPoints />;
    case "reviews": {
      const supabase = await createClient();
      const [{ data: reviewCategories }, { data: reviews }] = await Promise.all([
        supabase
          .from("categories")
          .select("id, slug, name")
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order"),
        supabase.from("reviews").select("id, category_id, author_label, rating, body").eq("is_active", true),
      ]);
      return (
        <ReviewsSection
          categories={(reviewCategories ?? []) as ReviewCategoryOption[]}
          reviews={(reviews ?? []) as ReviewRow[]}
        />
      );
    }
    case "product_display": {
      const config: ProductDisplayConfig = {
        title: "추천 상품",
        mode: "latest",
        categoryIds: [],
        productIds: [],
        limit: 6,
        ...(section.config as Partial<ProductDisplayConfig>),
      };
      const data = await getProductDisplayData(config);
      return (
        <ProductDisplaySection
          title={config.title}
          mode={data.mode}
          categories={data.categories}
          productsByCategory={data.productsByCategory}
          manualProducts={data.manualProducts}
          isLoggedIn={isLoggedIn}
        />
      );
    }
    case "why_steps":
      return <WhyPossible />;
    case "cta":
      return <BottomCta />;
    case "rich_text": {
      const config: RichTextConfig = { title: "", text: "", ...(section.config as Partial<RichTextConfig>) };
      return <RichTextSection title={config.title} text={config.text} />;
    }
    case "notice_list": {
      const config: NoticeListConfig = { title: "공지사항", limit: 5, ...(section.config as Partial<NoticeListConfig>) };
      const supabase = await createClient();
      const { data } = await supabase
        .from("notices")
        .select("id, title, published_at")
        .eq("is_active", true)
        .lte("published_at", new Date().toISOString())
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(config.limit);
      return <NoticeListSection title={config.title} notices={data ?? []} />;
    }
    default:
      return null;
  }
}

export async function PageRenderer({ sections }: { sections: PageSectionRow[] }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      {sections.map((section) => (
        <Section key={section.id} section={section} isLoggedIn={isLoggedIn} />
      ))}
    </>
  );
}
