import { listPages } from "@/lib/design/pages-query";
import { PageListManager } from "@/components/admin/design/PageListManager";
import { CodeManagedPageList } from "@/components/admin/design/CodeManagedPageList";

export default async function AdminPagesPage() {
  const pages = await listPages();
  return (
    <div>
      <PageListManager pages={pages} />
      <CodeManagedPageList />
    </div>
  );
}
