import { CrisGolfProgram } from "@/components/travel/CrisGolfProgram";
import { BannerStrip } from "@/components/design/BannerStrip";
import { getActiveBanners } from "@/lib/design/public-queries";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "travel").single();
  const banners = category ? await getActiveBanners(category.id) : [];

  return (
    <>
      <BannerStrip banners={banners} />
      <CrisGolfProgram />
    </>
  );
}
