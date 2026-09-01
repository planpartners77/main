import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, body, image_url, start_at, end_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const events = data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">EVENT</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">이벤트</h1>
      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
          진행 중인 이벤트가 없습니다. 서비스 오픈 후 공개됩니다.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {events.map((event) => (
            <div key={event.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {event.image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션
                <img src={event.image_url} alt={event.title} className="h-40 w-full object-cover" />
              )}
              <div className="px-6 py-5">
                <h2 className="font-bold text-gray-900">{event.title}</h2>
                <p className="mt-1 text-xs text-gray-400">
                  {event.start_at ? new Date(event.start_at).toLocaleDateString("ko-KR") : "상시"}
                  {event.end_at ? ` ~ ${new Date(event.end_at).toLocaleDateString("ko-KR")}` : ""}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{event.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
