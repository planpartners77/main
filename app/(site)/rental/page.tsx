import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { getSelfServiceProductList } from "@/lib/products/self-service-list-query";
import { SelfServiceCategoryLanding } from "@/components/shared/SelfServiceCategoryLanding";

export default async function RentalPage() {
  const category = getCategory("rental");
  if (!category) notFound();

  const products = await getSelfServiceProductList("rental");
  return <SelfServiceCategoryLanding category={category} products={products} />;
}
