import { createClient } from "@/lib/supabase/server";
import { EventManager, type EventRow } from "@/components/admin/design/EventManager";

export default async function DesignEventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, body, image_url, start_at, end_at, is_active")
    .order("created_at", { ascending: false });
  return <EventManager events={(data ?? []) as EventRow[]} />;
}
