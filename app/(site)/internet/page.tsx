import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { getSelfServiceProductList } from "@/lib/products/self-service-list-query";
import { SelfServiceCategoryLanding } from "@/components/shared/SelfServiceCategoryLanding";

export default async function InternetPage() {
  const category = getCategory("internet");
  if (!category) notFound();

  const products = await getSelfServiceProductList("internet");
  return <SelfServiceCategoryLanding category={category} products={products} />;
}
