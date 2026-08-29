import { BUSINESS_INFO } from "@/lib/business-info";

function LegalRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-gray-400">{label}</span>{" "}
      <span className={value ? "" : "text-gray-500 italic"}>
        {value ?? "등록 후 반영 예정"}
      </span>
    </div>
  );
}

// 가이드 §12-2 Footer 구성: 상단 고정 문구 + 카테고리별 법적 고지 영역.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800 bg-[var(--brand-navy-dark)] text-sm text-gray-300">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="font-medium text-white">
          플랜파트너스는 여러 통신사·보험사·상조회사를 비교해 가장 유리한 조건을 찾아드리는
          비교·중개 전문 플랫폼입니다.
        </p>

        <div className="mt-6 grid gap-1 text-xs leading-relaxed sm:grid-cols-2">
          <LegalRow label="상호" value={BUSINESS_INFO.companyName} />
          <LegalRow label="대표자" value={BUSINESS_INFO.ceo} />
          <LegalRow label="사업자등록번호" value={BUSINESS_INFO.bizRegNo} />
          <LegalRow label="법인등록번호" value={BUSINESS_INFO.corpRegNo} />
          <LegalRow label="주소" value={BUSINESS_INFO.address} />
          <LegalRow label="업태/종목" value={`${BUSINESS_INFO.bizType} / ${BUSINESS_INFO.bizItem}`} />
          <LegalRow label="통신판매중개업 신고번호" value={BUSINESS_INFO.mailOrderRegNo} />
          <LegalRow label="개인정보 보호책임자" value={BUSINESS_INFO.privacyOfficer} />
          <LegalRow label="보험 모집인 등록번호" value={BUSINESS_INFO.insuranceAgentRegNo} />
          <LegalRow
            label="상조 선불식 할부거래업 등록번호"
            value={BUSINESS_INFO.funeralInstallmentRegNo}
          />
        </div>

        <p className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} {BUSINESS_INFO.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
