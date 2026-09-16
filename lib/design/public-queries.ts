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
  dismiss_days: number;
  device_target: "all" | "mobile" | "desktop";
  login_target: "all" | "guest" | "member";
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

// target_mode/category_ids로 다중 대상(포함/제외)을 표현한다(0048_popup_multi_target.sql).
// audienceKey는 현재 화면을 가리키는 값 하나 — 메인페이지면 "home", 카테고리 페이지면 그 id,
// 그 외(마이페이지 등 카테고리 밖 페이지)면 null. null일 땐 category_ids로 콕 집어 include할
// 방법이 없으므로 include 모드는 매칭에서 자연히 제외되고 all/exclude만 노출 대상이 된다.
export async function getActivePopups({
  categoryId,
  isHome,
}: {
  categoryId: string | null;
  isHome: boolean;
}): Promise<PublicPopup[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const audienceKey = isHome ? "home" : categoryId;

  let query = supabase
    .from("popups")
    .select("id, title, image_url, body, link_url, display_type, dismiss_days, device_target, login_target")
    .eq("is_active", true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order("sort_order", { ascending: true });

  query = audienceKey
    ? query.or(
        `target_mode.eq.all,and(target_mode.eq.include,category_ids.cs.{${audienceKey}}),and(target_mode.eq.exclude,category_ids.not.cs.{${audienceKey}})`,
      )
    : query.neq("target_mode", "include");

  const { data } = await query;
  return data ?? [];
}

// 팝업 레이어(app/(site)/layout.tsx)는 전 페이지 공용이라 어느 카테고리 페이지인지
// path 세그먼트로 직접 알아내야 한다(banners처럼 각 카테고리 page.tsx가 직접 아는 구조가 아님).
export async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}
