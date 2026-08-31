import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { CategoryDropdown } from "@/components/shared/CategoryDropdown";

const TONE: Record<string, string> = {
  travel: "bg-sky-50 text-sky-600",
  internet: "bg-blue-50 text-blue-600",
  mobile: "bg-indigo-50 text-indigo-600",
  rental: "bg-emerald-50 text-emerald-600",
  insurance: "bg-amber-50 text-amber-600",
  funeral: "bg-slate-100 text-slate-600",
};

export function CategoryQuickNav() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {CATEGORIES.map((category) => (
          <div key={category.slug} className="group relative">
            <Link
              href={`/${category.slug}`}
              className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-2 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/30 hover:shadow-md"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full ${TONE[category.slug] ?? "bg-gray-100 text-gray-600"}`}
              >
                <CategoryIcon slug={category.slug} className="h-6 w-6" />
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-[var(--brand-navy)]">
                {category.name}
                {category.subcategories && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-3 w-3 text-gray-400 transition-transform duration-200 sm:group-hover:rotate-180 sm:group-hover:text-[var(--brand-blue)]"
                  >
                    <path
                      d="M5 7.5 10 12.5 15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {category.trackType === "consult_required" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  상담 필수
                </span>
              )}
            </Link>

            {category.subcategories && (
              <div className="pointer-events-none absolute inset-x-0 top-full z-20 hidden justify-center pt-2 opacity-0 translate-y-1 transition-all duration-200 ease-out sm:flex sm:group-hover:pointer-events-auto sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                <CategoryDropdown items={category.subcategories} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
