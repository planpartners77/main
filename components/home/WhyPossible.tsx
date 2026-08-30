const STEPS = [
  {
    step: "01",
    title: "제휴사와 직접 비교",
    body: "여러 통신사·보험사·상조회사의 조건을 한 화면에서 나란히 비교합니다.",
  },
  {
    step: "02",
    title: "상담사가 직접 확인",
    body: "셀프 비교가 어려운 보험·상조는 담당 상담사가 조건을 다시 확인해드려요.",
  },
  {
    step: "03",
    title: "가입 후에도 이력 관리",
    body: "가입 이후에도 마이페이지에서 계약·상담 이력을 계속 확인할 수 있어요.",
  },
];

export function WhyPossible() {
  return (
    <section className="bg-[var(--surface-tint)] py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">이런 비교가 가능한 이유는</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-bold text-white">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold text-[var(--brand-navy)]">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
