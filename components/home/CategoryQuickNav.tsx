import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/components/shared/CategoryIcon";

const TONE: Record<string, string> = {
  internet: "bg-blue-50 text-blue-600",
  mobile: "bg-indigo-50 text-indigo-600",
  rental: "bg-emerald-50 text-emerald-600",
  insurance: "bg-amber-50 text-amber-600",
  funeral: "bg-slate-100 text-slate-600",
};

export function CategoryQuickNav() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/${category.slug}`}
            className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-2 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${TONE[category.slug] ?? "bg-gray-100 text-gray-600"}`}
            >
              <CategoryIcon slug={category.slug} className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-[var(--brand-navy)]">{category.name}</span>
            {category.trackType === "consult_required" && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                상담 필수
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
