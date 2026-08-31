import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin/session";
import { MediaLibrary, type MediaAsset } from "@/components/admin/design/MediaLibrary";

export default async function DesignMediaPage() {
  const session = await getAdminSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("media_assets")
    .select("id, storage_path, file_name, mime_type, size_bytes, created_at")
    .order("created_at", { ascending: false });

  return <MediaLibrary assets={(data ?? []) as MediaAsset[]} uploaderId={session?.userId ?? ""} />;
}
