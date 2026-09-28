import { createClient } from "@/lib/supabase/server";

export interface SelfServiceProductListItem {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
}

// 전용 스펙 UI가 없는 셀프서비스형 카테고리(인터넷·가전렌탈 등)의 목록 페이지가 공유하는 조회 함수.
export async function getSelfServiceProductList(categorySlug: string): Promise<SelfServiceProductListItem[]> {
  const supabase = await createClient();
  const { data: categoryRow } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
  if (!categoryRow) return [];

  const { data } = await supabase
    .from("products")
    .select("id, title, image_url, base_price")
    .eq("is_active", true)
    .eq("is_listed", true)
    .eq("category_id", categoryRow.id)
    .order("created_at", { ascending: true });

  return (data ?? []) as SelfServiceProductListItem[];
}
