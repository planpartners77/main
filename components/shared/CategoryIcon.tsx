const PATHS: Record<string, string> = {
  travel: "M22 2 11 13 M22 2 15 22 11 13 2 9 22 2Z",
  internet: "M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01",
  mobile: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM11 19h2",
  rental: "M4 21V9l8-6 8 6v12M9 21v-6h6v6",
  insurance: "M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z",
  funeral: "M12 3v7M8 10h8l2.5 11h-13L8 10Z",
};

// 실제 브랜드 아이콘 세트 도입 전까지 사용하는 최소 선형 아이콘.
export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[slug] ?? PATHS.insurance} />
    </svg>
  );
}
