import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeLandingPageExtra, type LandingPageExtra } from "./page-spec";

export interface LandingPageListItem {
  id: string;
  title: string;
  image_url: string | null;
  extra: LandingPageExtra;
  is_listed: boolean;
}

interface RawProduct {
  id: string;
  title: string;
  image_url: string | null;
  extra: Record<string, unknown>;
  is_listed: boolean;
}

const SELECT_COLUMNS = "id, title, image_url, extra, is_listed";

function toListItem(row: RawProduct): LandingPageListItem {
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    extra: normalizeLandingPageExtra(row.extra),
    is_listed: row.is_listed,
  };
}

export async function getLandingPageList(): Promise<LandingPageListItem[]> {
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "lp").maybeSingle();
  if (!category) return [];

  const { data } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("category_id", category.id)
    .eq("is_active", true)
    // 목록에서만 뺀 "미진열" 상품을 걸러낸다. 상세페이지(getLandingPageDetail)는 이 필터를
    // 두지 않아 직접 링크로는 그대로 접근된다.
    .eq("is_listed", true)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as RawProduct[]).map(toListItem);
}

// generateMetadata와 페이지 본문이 같은 상품을 각각 조회하므로, 한 요청 안에서는
// 한 번만 쿼리하도록 React cache()로 묶는다.
export const getLandingPageDetail = cache(async (id: string): Promise<LandingPageListItem | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(SELECT_COLUMNS).eq("id", id).eq("is_active", true).maybeSingle();
  if (!data) return null;
  return toListItem(data as unknown as RawProduct);
});
