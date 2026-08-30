import Link from "next/link";

const POINTS = [
  {
    title: "숨어있는 사은품까지",
    body: "가입 전엔 잘 보이지 않는 사은품·캐시백 조건까지 한 번에 비교해드려요.",
  },
  {
    title: "위약금·지원금 확인",
    body: "약정 해지 시 위약금과 전환 지원금을 먼저 계산해 손해를 막아드려요.",
  },
  {
    title: "카테고리별 맞춤 상담",
    body: "보험·상조처럼 상담이 꼭 필요한 카테고리는 전문 상담사가 연결됩니다.",
  },
];

// 벤치마킹 캡처의 '옅은 블루 배경 + 흰 카드' 배너 구성을 컨셉 컬러로 반영.
// 검증되지 않은 구체적 금액/수치는 표시광고 규정 리스크가 있어 배제하고 가치 제안 카피로 대체했다.
// 실제 수치는 §Phase5 컴플라이언스 검토 후 카테고리 랜딩(§12-4/§12-5)에서 개별적으로 노출한다.
export function IncentiveBanner() {
  return (
    <section className="bg-[var(--surface-tint)] py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-xl font-bold text-[var(--brand-navy)]">
          비교는 필수, 혜택까지 꼼꼼하게
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[var(--brand-navy)]">{point.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{point.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/quiz/internet"
            className="inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)]"
          >
            내 혜택 확인하기
          </Link>
        </div>
      </div>
    </section>
  );
}
