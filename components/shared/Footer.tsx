import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/business-info";
import { LEGAL_NAV } from "@/lib/legal-content";

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

const MENU_LINKS = [
  { href: "/company", label: "회사소개" },
  { href: "/notices", label: "공지사항" },
  { href: "/events", label: "이벤트" },
  { href: "/rewards", label: "사은품 지급 명단" },
];

// 소셜 채널은 아직 실제 운영 계정이 없어 임의 URL을 넣지 않는다(§ 정보 정확성 원칙).
// 계정이 개설되면 각 항목에 href를 채워 <Link>로 교체할 것.
const SNS_LABELS = ["네이버 카페", "페이스북", "유튜브", "인스타그램", "틱톡"];

// 가이드 §12-2 Footer 구성: 메뉴 링크 + 상단 고정 문구 + 카테고리별 법적 고지 영역 + 법적 문서 링크.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800 bg-[var(--brand-navy-dark)] text-sm text-gray-300">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-gray-800 pb-6 text-sm">
          {MENU_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-gray-300 hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <p className="mt-6 font-medium text-white">
          플랜파트너스는 여러 통신사·보험사·상조회사를 비교해 가장 유리한 조건을 찾아드리는
          비교·중개 전문 플랫폼입니다.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {BUSINESS_INFO.companyName}는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 상품,
          상품정보, 거래에 관한 의무와 책임은 거래당사자에게 있습니다.
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

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {SNS_LABELS.map((label) => (
            <span key={label}>{label} (오픈 예정)</span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-800 pt-6 text-xs">
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.slug}
              href={`/legal/${item.slug}`}
              className={
                item.slug === "privacy" || item.slug === "terms"
                  ? "font-semibold text-white hover:underline"
                  : "text-gray-400 hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} {BUSINESS_INFO.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
