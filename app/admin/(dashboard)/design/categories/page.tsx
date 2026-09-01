import { getAllCategoriesTree } from "@/lib/design/category-tree";
import { CategoryTreeManager } from "@/components/admin/design/CategoryTreeManager";

export default async function DesignCategoriesPage() {
  const tree = await getAllCategoriesTree();
  return <CategoryTreeManager tree={tree} />;
}
