import { Fragment } from "react";
import { Hero } from "@/components/home/Hero";
import { CategoryQuickNav } from "@/components/home/CategoryQuickNav";
import { IncentiveBanner } from "@/components/home/IncentiveBanner";
import { TrustPoints } from "@/components/home/TrustPoints";
import { ReviewsSection, type ReviewCategoryOption, type ReviewRow } from "@/components/home/ReviewsSection";
import { WhyPossible } from "@/components/home/WhyPossible";
import { TravelSpotlight } from "@/components/home/TravelSpotlight";
import { UsimSpotlightSection } from "@/components/usim/UsimSpotlightSection";
import { getUsimPlanList } from "@/lib/usim/plans-query";
import { sortPlans, type UsimPlanListItem } from "@/lib/usim/filters";
import { BottomCta } from "@/components/home/BottomCta";
import { BannerStrip } from "@/components/design/BannerStrip";
import { ProductDisplaySection } from "@/components/design/ProductDisplaySection";
import { RichTextSection } from "@/components/design/RichTextSection";
import { NoticeListSection } from "@/components/design/NoticeListSection";
import { getActiveBanners } from "@/lib/design/public-queries";
import { getCategoryTree } from "@/lib/design/category-tree";
import { getProductDisplayData } from "@/lib/design/products-query";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import type { PageSectionRow } from "@/lib/design/pages-query";
import type {
  HeroSectionConfig,
  ProductDisplayConfig,
  UsimSpotlightConfig,
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
    case "usim_spotlight": {
      const config: UsimSpotlightConfig = {
        title: "인기 유심 요금제",
        limit: 6,
        mode: "auto",
        planIds: [],
        ...(section.config as Partial<UsimSpotlightConfig>),
      };
      const allPlans = sortPlans(await getUsimPlanList(), "recommended");
      const items =
        config.mode === "manual" && config.planIds.length > 0
          ? config.planIds
              .map((id) => allPlans.find((plan) => plan.id === id))
              .filter((plan): plan is UsimPlanListItem => !!plan)
              .slice(0, config.limit)
          : allPlans.slice(0, config.limit);
      return <UsimSpotlightSection title={config.title} items={items} />;
    }
    case "travel_spotlight":
      return <TravelSpotlight />;
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

// 헤더 성격의 섹션(히어로/배너/카테고리 네비)은 배경 교차 대상에서 제외한다 — 페이지 최상단
// 존으로서 고정 흰색을 유지하고, 바로 아래의 첫 콘텐츠 섹션이 그와 다른 배경으로 시작한다.
const HEADER_TYPES = new Set(["hero", "banner_strip", "category_nav"]);

const SURFACE_WHITE = "bg-white";
const SURFACE_TINT = "bg-[var(--surface-tint)]";
const SURFACE_STRONG = "bg-[var(--surface-tint-strong)]";

export async function PageRenderer({ sections }: { sections: PageSectionRow[] }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Section은 훅 없는 서버 컴포넌트라 JSX 없이 직접 호출해 미리 결과를 구해둘 수 있다.
  // 콘텐츠가 null인 섹션(관리자가 조건을 비워둔 경우)은 배경 교차 카운트에서 제외해야
  // 하므로, 배경을 정하는 두 번째 패스보다 먼저 전부 병렬로 리졸브한다.
  const contents = await Promise.all(sections.map((section) => Section({ section, isLoggedIn })));

  // 어드민이 섹션 순서를 바꿔도 배경이 항상 직전 섹션과 달라지도록, 하드코딩된 타입별
  // 배경 대신 "직전 배경과 다르게" 규칙으로 매 렌더링마다 새로 계산한다.
  let lastSurface: string = SURFACE_WHITE;
  const rendered = sections.map((section, index) => {
    const content = contents[index];
    if (content === null) return null;

    // Hero/카테고리 퀵네비는 항상 최초 뷰포트 안에 있어 리빌 애니메이션이 오히려
    // 깜빡임처럼 보이므로 제외하고, 그 아래 섹션들만 스크롤 리빌을 적용한다.
    if (HEADER_TYPES.has(section.type)) {
      lastSurface = SURFACE_WHITE;
      return <Fragment key={section.id}>{content}</Fragment>;
    }

    if (section.type === "cta") {
      lastSurface = SURFACE_STRONG;
      return <ScrollReveal key={section.id}>{content}</ScrollReveal>;
    }

    const surface = lastSurface === SURFACE_WHITE ? SURFACE_TINT : SURFACE_WHITE;
    lastSurface = surface;
    return (
      <ScrollReveal key={section.id}>
        <section className={`${surface} py-14`}>{content}</section>
      </ScrollReveal>
    );
  });

  return <>{rendered}</>;
}
