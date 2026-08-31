import { getHomePageSettings } from "@/lib/design/site-settings";
import { HomePageManager } from "@/components/admin/design/HomePageManager";

export default async function DesignPagesPage() {
  const settings = await getHomePageSettings();
  return <HomePageManager settings={settings} />;
}
