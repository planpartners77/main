import { createClient } from "@/lib/supabase/server";

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, title, body, is_pinned, published_at")
    .eq("is_active", true)
    .lte("published_at", new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  const notices = data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">NOTICE</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">공지사항</h1>
      {notices.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          {notices.map((notice) => (
            <details key={notice.id} className="group px-6 py-4">
              <summary className="flex cursor-pointer items-center gap-2 list-none">
                {notice.is_pinned && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">고정</span>
                )}
                <span className="font-medium text-gray-900">{notice.title}</span>
                <span className="ml-auto shrink-0 text-xs text-gray-400">
                  {new Date(notice.published_at).toLocaleDateString("ko-KR")}
                </span>
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{notice.body}</p>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
