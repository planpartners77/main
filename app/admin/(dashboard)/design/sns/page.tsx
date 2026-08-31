import { getSnsLinks } from "@/lib/design/site-settings";
import { SnsLinksManager } from "@/components/admin/design/SnsLinksManager";

export default async function DesignSnsPage() {
  const links = await getSnsLinks();
  return <SnsLinksManager links={links} />;
}
