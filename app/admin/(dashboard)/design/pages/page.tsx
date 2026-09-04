import { listPages } from "@/lib/design/pages-query";
import { PageListManager } from "@/components/admin/design/PageListManager";

export default async function AdminPagesPage() {
  const pages = await listPages();
  return <PageListManager pages={pages} />;
}
