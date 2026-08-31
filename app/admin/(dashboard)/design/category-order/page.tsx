import { getCategoryOrder } from "@/lib/design/site-settings";
import { getOrderedCategories } from "@/lib/categories";
import { CategoryOrderManager } from "@/components/admin/design/CategoryOrderManager";

export default async function DesignCategoryOrderPage() {
  const order = await getCategoryOrder();
  const categories = getOrderedCategories(order).map((c) => ({ slug: c.slug, name: c.name }));
  return <CategoryOrderManager categories={categories} />;
}
