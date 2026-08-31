import { createClient } from "@/lib/supabase/server";
import { BannerManager, type BannerRow } from "@/components/admin/design/BannerManager";

export default async function DesignBannersPage() {
  const supabase = await createClient();
  const [{ data: banners }, { data: categories }] = await Promise.all([
    supabase
      .from("banners")
      .select("id, title, image_url, link_url, category_id, sort_order, is_active, start_at, end_at")
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return <BannerManager banners={(banners ?? []) as BannerRow[]} categories={categories ?? []} />;
}
