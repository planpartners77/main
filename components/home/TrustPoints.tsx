const ITEMS = [
  "허위매물 없는 실제 계약 가능 조건만 안내",
  "강매 없는 상담 — 원치 않으면 언제든 종료",
  "상담·계약 이력 마이페이지에서 투명하게 확인",
  "해지·청약철회 절차와 위약금을 사전에 안내",
];

export function TrustPoints() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="text-xl font-bold text-[var(--brand-navy)]">더 안심할 수 있도록</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:items-center">
        <ul className="space-y-3">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-[10px] font-bold text-white">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="flex h-40 items-center justify-center rounded-2xl bg-[var(--surface-tint)] text-sm text-gray-400 md:h-full">
          신뢰 관련 일러스트 자리 (에셋 확보 후 교체)
        </div>
      </div>
    </section>
  );
}
