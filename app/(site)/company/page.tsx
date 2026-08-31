import { BUSINESS_INFO } from "@/lib/business-info";

export default function CompanyPage() {
  const rows: [string, string][] = [
    ["상호", BUSINESS_INFO.companyName],
    ["대표자", BUSINESS_INFO.ceo],
    ["사업자등록번호", BUSINESS_INFO.bizRegNo],
    ["법인등록번호", BUSINESS_INFO.corpRegNo],
    ["주소", BUSINESS_INFO.address],
    ["업태/종목", `${BUSINESS_INFO.bizType} / ${BUSINESS_INFO.bizItem}`],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">COMPANY</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">회사소개</h1>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        {BUSINESS_INFO.companyName}는 인터넷·휴대폰·가전렌탈·여행·보험·상조 등 생활 밀착형 상품을
        한 곳에서 비교하고, 이용자에게 가장 유리한 조건을 찾아드리는 비교·중개 전문 플랫폼입니다.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        여러 통신사·보험사·상조회사의 조건을 투명하게 비교할 수 있도록 돕고, 이용자가 직접 판단하고
        선택할 수 있는 정보를 제공하는 것을 목표로 합니다.
      </p>

      <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <dl className="divide-y divide-gray-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-gray-400">{k}</dt>
              <dd className="text-right font-medium text-[var(--brand-navy)]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
