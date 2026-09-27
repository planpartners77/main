const ITEMS = [
  "허위매물 없는 실제 계약 가능 조건만 안내",
  "강매 없는 상담 — 원치 않으면 언제든 종료",
  "상담·계약 이력 마이페이지에서 투명하게 확인",
  "해지·청약철회 절차와 위약금을 사전에 안내",
];

// ITEMS와 1:1로 대응하는 아이콘 카드. 실제 일러스트 에셋이 확보되기 전까지의 임시 대체가
// 아니라 그 자체로 완결된 디자인으로 두되, 에셋이 준비되면 이 영역만 교체하면 된다.
const ICON_CARDS = [
  { label: "정직한 매물", Icon: ShieldCheckIcon },
  { label: "부담 없는 상담", Icon: HandStopIcon },
  { label: "투명한 이력 관리", Icon: ClockIcon },
  { label: "사전 고지", Icon: InfoIcon },
];

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 8.5 4.1-.9 7-4.2 7-8.5V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HandStopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5" strokeLinecap="round" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" strokeLinecap="round" />
      <path d="M14 11.2V5.5a1.5 1.5 0 0 1 3 0V13" strokeLinecap="round" />
      <path d="M17 9.5a1.5 1.5 0 0 1 3 0V15c0 3.6-2.7 6.5-6.5 6.5S7 18.6 7 15v-2.8L5.4 10a1.4 1.4 0 0 1 2-2L9 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--surface-tint)] p-5 md:h-full md:gap-4 md:p-6">
          {ICON_CARDS.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white px-3 py-5 text-center shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
                <Icon />
              </span>
              <span className="text-xs font-semibold text-[var(--brand-navy)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
