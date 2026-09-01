import { createClient } from "@/lib/supabase/server";
import { NoticeManager, type NoticeRow } from "@/components/admin/design/NoticeManager";

export default async function DesignNoticesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, title, body, is_pinned, is_active, published_at")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  return <NoticeManager notices={(data ?? []) as NoticeRow[]} />;
}
