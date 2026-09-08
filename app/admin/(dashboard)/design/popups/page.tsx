import { createClient } from "@/lib/supabase/server";
import { PopupManager, type PopupRow } from "@/components/admin/design/PopupManager";

export default async function DesignPopupsPage() {
  const supabase = await createClient();
  const [{ data: popups }, { data: categories }] = await Promise.all([
    supabase
      .from("popups")
      .select(
        "id, title, image_url, body, link_url, display_type, category_id, dismiss_days, impression_count, click_count, sort_order, is_active, start_at, end_at",
      )
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return <PopupManager popups={(popups ?? []) as PopupRow[]} categories={categories ?? []} />;
}
