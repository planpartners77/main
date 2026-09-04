import { createClient } from "@/lib/supabase/server";
import type { ProductDisplayConfig } from "@/lib/design/page-sections";
import type { DisplayCategory, DisplayProduct, ProductDisplayData } from "@/lib/design/product-display";

const PRODUCT_COLUMNS = "id, title, image_url, base_price, incentive_min, incentive_max, incentive_exact, category_id";

// product_display 섹션 하나가 필요로 하는 데이터를 config.mode에 따라 조회한다.
// - manual: 관리자가 지정한 productIds 순서 그대로(§상품 진열 페이지 — 특정 상품을 큐레이션)
// - latest: categoryIds(비었으면 활성 최상위 카테고리 전체)별로 최신 활성 상품 limit개씩(탭 구성)
export async function getProductDisplayData(config: ProductDisplayConfig): Promise<ProductDisplayData> {
  const supabase = await createClient();

  if (config.mode === "manual") {
    if (config.productIds.length === 0) {
      return { mode: "manual", categories: [], productsByCategory: {}, manualProducts: [] };
    }
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .in("id", config.productIds)
      .eq("is_active", true);
    const byId = new Map((data ?? []).map((p) => [p.id, p as DisplayProduct]));
    const ordered = config.productIds.map((id) => byId.get(id)).filter((p): p is DisplayProduct => !!p);
    return { mode: "manual", categories: [], productsByCategory: {}, manualProducts: ordered };
  }

  const categoryIds = config.categoryIds;
  const categoriesQuery =
    categoryIds.length > 0
      ? supabase.from("categories").select("id, slug, name").in("id", categoryIds).eq("is_active", true).order("sort_order")
      : supabase.from("categories").select("id, slug, name").is("parent_id", null).eq("is_active", true).order("sort_order");
  const { data: categoriesData } = await categoriesQuery;
  const categories = (categoriesData ?? []) as DisplayCategory[];

  const productsByCategory: Record<string, DisplayProduct[]> = {};
  await Promise.all(
    categories.map(async (category) => {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(config.limit);
      productsByCategory[category.id] = (data ?? []) as DisplayProduct[];
    }),
  );

  return { mode: "latest", categories, productsByCategory, manualProducts: [] };
}

// /compare/[category] 전용 — 탭 없이 한 카테고리의 활성 상품을 최신순으로 그리드 노출.
export async function getCategoryDisplayProducts(categorySlug: string, limit = 60): Promise<DisplayProduct[]> {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .is("parent_id", null)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) return [];

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DisplayProduct[];
}
