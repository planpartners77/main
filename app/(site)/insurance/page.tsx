import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { CategoryConsultLanding, type ConsultProduct } from "@/components/shared/CategoryConsultLanding";

export default async function InsurancePage() {
  const category = getCategory("insurance");
  if (!category) notFound();

  const supabase = await createClient();
  const { data: categoryRow } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "insurance")
    .maybeSingle();

  const { data } = categoryRow
    ? await supabase
        .from("products")
        .select("id, title, extra, partners(name)")
        .eq("is_active", true)
        .eq("category_id", categoryRow.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const products: ConsultProduct[] = ((data ?? []) as unknown as Array<{
    id: string;
    title: string;
    extra: Record<string, unknown> | null;
    partners: { name: string } | null;
  }>).map((p) => ({
    id: p.id,
    title: p.title,
    partnerName: p.partners?.name ?? null,
    insurer: (p.extra?.insurer as string | undefined) ?? null,
    coverageSummary: (p.extra?.coverage_summary as string | undefined) ?? null,
    monthlyPremium: (p.extra?.monthly_premium as string | undefined) ?? null,
  }));

  return <CategoryConsultLanding category={category} products={products} />;
}
