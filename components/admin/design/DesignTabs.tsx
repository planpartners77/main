"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/design", label: "이미지" },
  { href: "/admin/design/banners", label: "배너" },
  { href: "/admin/design/popups", label: "팝업" },
  { href: "/admin/design/pages", label: "페이지" },
  { href: "/admin/design/category-order", label: "카테고리 진열" },
  { href: "/admin/design/sns", label: "SNS" },
];

export function DesignTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              active ? "bg-[var(--brand-navy)] text-white" : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
