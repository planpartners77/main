import { createClient } from "@/lib/supabase/server";
import { PopupManager, type PopupRow } from "@/components/admin/design/PopupManager";

export default async function DesignPopupsPage() {
  const supabase = await createClient();
  const { data: popups } = await supabase
    .from("popups")
    .select("id, title, image_url, body, link_url, display_type, sort_order, is_active, start_at, end_at")
    .order("sort_order", { ascending: true });

  return <PopupManager popups={(popups ?? []) as PopupRow[]} />;
}
