import { createClient } from "@/lib/supabase/server";

// 이름 중간 글자를 *로 가려 개인정보를 보호한다. 2글자면 마지막 글자만, 3글자 이상이면
// 가운데 구간을 전부 마스킹한다("홍길동" -> "홍*동", "김민서준" -> "김**준").
function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
}

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reward_recipients")
    .select("id, recipient_name, reward_item, category, awarded_at")
    .eq("is_active", true)
    .order("awarded_at", { ascending: false });
  const rewards = data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">REWARDS</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">사은품 지급 명단</h1>
      <p className="mt-2 text-sm text-gray-500">
        상품 신청 완료 후 사은품이 지급된 이용자 명단을 안내합니다. (개인정보 보호를 위해 이름 일부는 비공개 처리됩니다)
      </p>
      {rewards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
          등록된 지급 내역이 없습니다. 서비스 오픈 후 공개됩니다.
        </div>
      ) : (
        <div className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between gap-3 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{maskName(reward.recipient_name)}</span>
                  <span className="text-sm text-gray-500">{reward.reward_item}</span>
                  {reward.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {reward.category}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {new Date(reward.awarded_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
