import { createClient } from "@/lib/supabase/server";
import { LEGAL_DOCS, type LegalSection } from "@/lib/legal-content";
import { LegalDocManager } from "@/components/admin/design/LegalDocManager";

export default async function DesignLegalPage() {
  const supabase = await createClient();
  const { data: overrides } = await supabase.from("legal_docs").select("slug, title, intro, sections");

  const docsBySlug: Record<string, { title: string; intro: string; sections: LegalSection[] }> = {};
  for (const [slug, doc] of Object.entries(LEGAL_DOCS)) {
    const override = overrides?.find((o) => o.slug === slug);
    docsBySlug[slug] = override
      ? { title: override.title, intro: override.intro, sections: override.sections as LegalSection[] }
      : { title: doc.title, intro: doc.intro, sections: doc.sections };
  }

  return <LegalDocManager docsBySlug={docsBySlug} />;
}
