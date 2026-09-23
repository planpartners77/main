import { createClient } from "@/lib/supabase/server";
import { normalizeLandingPageExtra, type LandingPageExtra } from "./page-spec";

export interface LandingPageListItem {
  id: string;
  title: string;
  image_url: string | null;
  extra: LandingPageExtra;
}

interface RawProduct {
  id: string;
  title: string;
  image_url: string | null;
  extra: Record<string, unknown>;
}

const SELECT_COLUMNS = "id, title, image_url, extra";

function toListItem(row: RawProduct): LandingPageListItem {
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    extra: normalizeLandingPageExtra(row.extra),
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

export async function getLandingPageDetail(id: string): Promise<LandingPageListItem | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(SELECT_COLUMNS).eq("id", id).eq("is_active", true).maybeSingle();
  if (!data) return null;
  return toListItem(data as unknown as RawProduct);
}
