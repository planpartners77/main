import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPageWithAllSections } from "@/lib/design/pages-query";
import { PageSectionBuilder } from "@/components/admin/design/PageSectionBuilder";

export default async function AdminPageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPageWithAllSections(id);
  if (!result) notFound();
  const { page, sections } = result;

  const supabase = await createClient();

  const [{ data: categories }, productTitleById] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name")
      .is("parent_id", null)
      .eq("is_active", true)
      .order("sort_order"),
    (async () => {
      const productIds = Array.from(
        new Set(
          sections
            .filter((s) => s.type === "product_display")
            .flatMap((s) => (s.config as { productIds?: string[] }).productIds ?? []),
        ),
      );
      if (productIds.length === 0) return {};
      const { data } = await supabase.from("products").select("id, title, image_url").in("id", productIds);
      const map: Record<string, { title: string; image_url: string | null }> = {};
      for (const p of data ?? []) {
        map[p.id] = { title: p.title, image_url: p.image_url };
      }
      return map;
    })(),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--brand-navy)]">{page.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {page.slug === "home" ? "홈페이지" : `/pages/${page.slug}`}
      </p>
      <div className="mt-6">
        <PageSectionBuilder
          page={page}
          sections={sections}
          categories={categories ?? []}
          productTitleById={productTitleById}
        />
      </div>
    </div>
  );
}
