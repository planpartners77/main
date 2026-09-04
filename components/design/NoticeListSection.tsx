import Link from "next/link";

interface NoticeListItem {
  id: string;
  title: string;
  published_at: string;
}

export function NoticeListSection({ title, notices }: { title: string; notices: NoticeListItem[] }) {
  if (notices.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2>
        <Link href="/notices" className="text-xs font-semibold text-gray-400 hover:text-[var(--brand-navy)]">
          더보기
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
        {notices.map((notice) => (
          <li key={notice.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="truncate text-gray-800">{notice.title}</span>
            <span className="ml-3 shrink-0 text-xs text-gray-400">
              {new Date(notice.published_at).toLocaleDateString("ko-KR")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
