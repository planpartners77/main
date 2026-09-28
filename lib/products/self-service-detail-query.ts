import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface SelfServiceProductRow {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
  apply_url: string | null;
  partner_name: string | null;
  detail_html: string;
  show_detail_html: boolean;
  is_active: boolean;
  is_listed: boolean;
}

type Row = {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
  apply_url: string | null;
  extra: Record<string, unknown> | null;
  is_active: boolean;
  is_listed: boolean;
  categories: { slug: string } | null;
  partners: { name: string } | null;
};

// 전용 스펙 UI가 없는 셀프서비스형 카테고리(인터넷·가전렌탈 등)의 상세 페이지가 공유하는 조회 함수.
// 카테고리별 페이지가 각각 호출하므로 React cache()로 한 요청 내 중복 조회를 막는다.
export const getSelfServiceProductDetail = cache(
  async (categorySlug: string, id: string): Promise<SelfServiceProductRow | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id, title, image_url, base_price, apply_url, extra, is_active, is_listed, categories(slug), partners(name)")
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as Row | null;
    if (!row || row.categories?.slug !== categorySlug || !row.is_active) return null;

    const extra = row.extra ?? {};
    return {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      base_price: row.base_price,
      apply_url: row.apply_url,
      partner_name: row.partners?.name ?? null,
      detail_html: typeof extra.detail_html === "string" ? extra.detail_html : "",
      show_detail_html: extra.show_detail_html === true,
      is_active: row.is_active,
      is_listed: row.is_listed,
    };
  },
);
