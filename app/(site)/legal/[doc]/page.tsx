import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalDoc, LEGAL_NAV, type LegalSection } from "@/lib/legal-content";
import { createClient } from "@/lib/supabase/server";

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc: slug } = await params;
  const fallback = getLegalDoc(slug);
  if (!fallback) notFound();

  // legal_docs에 관리자가 등록한 확정본이 있으면 그것으로 덮어쓰고, 없으면 초안(lib/legal-content.ts)을 보여준다.
  const supabase = await createClient();
  const { data: override } = await supabase
    .from("legal_docs")
    .select("title, intro, sections, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  const doc = override
    ? { title: override.title, intro: override.intro, sections: override.sections as LegalSection[] }
    : fallback;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="flex flex-wrap gap-2">
        {LEGAL_NAV.map((item) => (
          <Link
            key={item.slug}
            href={`/legal/${item.slug}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              item.slug === slug
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                : "border-gray-200 text-gray-500 hover:border-[var(--brand-blue)]/50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <h1 className="mt-6 text-2xl font-bold text-[var(--brand-navy)]">{doc.title}</h1>
      {!override && (
        <p className="mt-2 text-xs text-gray-400">본 문서는 초안이며, 법률 검토를 거쳐 확정됩니다.</p>
      )}
      {override?.updated_at && (
        <p className="mt-2 text-xs text-gray-400">최종 개정일: {new Date(override.updated_at).toLocaleDateString("ko-KR")}</p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-gray-600">{doc.intro}</p>

      <div className="mt-8 space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-bold text-[var(--brand-navy)]">{section.heading}</h2>
            <ul className="mt-2 space-y-1.5">
              {section.body.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-gray-600">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
