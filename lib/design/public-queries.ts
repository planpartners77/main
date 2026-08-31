import { createClient } from "@/lib/supabase/server";

export interface PublicBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
}

export interface PublicPopup {
  id: string;
  title: string;
  image_url: string | null;
  body: string | null;
  link_url: string | null;
  display_type: "layer" | "bottom_bar";
}

// 노출기간(start_at/end_at)은 null 허용이라 PostgREST에서 "컬럼이 null이거나, now와 비교해 범위 안"을
// 각각 별도 .or()로 걸어야 한다 — 하나의 .or()에 합치면 전체가 OR로 묶여 의도한 AND 조건이 깨진다.
export async function getActiveBanners(categoryId: string | null): Promise<PublicBanner[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("banners")
    .select("id, title, image_url, link_url")
    .eq("is_active", true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order("sort_order", { ascending: true });

  query = categoryId ? query.eq("category_id", categoryId) : query.is("category_id", null);

  const { data } = await query;
  return data ?? [];
}

export async function getActivePopups(): Promise<PublicPopup[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("popups")
    .select("id, title, image_url, body, link_url, display_type")
    .eq("is_active", true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order("sort_order", { ascending: true });

  return data ?? [];
}
