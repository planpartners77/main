import Link from "next/link";
import { LEGAL_NAV } from "@/lib/legal-content";
import { getCompanyInfo, getSnsLinks } from "@/lib/design/site-settings";

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

// 소셜 채널은 관리자 SNS 관리 화면(site_settings.sns_links)에서 url·enabled를 설정하며,
// 계정이 아직 없거나 비활성 상태인 채널은 임의 URL 없이 "오픈 예정" 텍스트로 표시한다
// (§ 정보 정확성 원칙 — 가짜 URL 금지).
// 가이드 §12-2 Footer 구성: 메뉴 링크 + 상단 고정 문구 + 카테고리별 법적 고지 영역 + 법적 문서 링크.
export async function Footer() {
  const [info, snsLinks] = await Promise.all([getCompanyInfo(), getSnsLinks()]);

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

        <p className="mt-6 font-medium text-white">{info.introText}</p>
        <p className="mt-2 text-xs text-gray-400">{info.disclaimerText}</p>

        <div className="mt-6 grid gap-1 text-xs leading-relaxed sm:grid-cols-2">
          <LegalRow label="상호" value={info.companyName} />
          <LegalRow label="대표자" value={info.ceo} />
          <LegalRow label="사업자등록번호" value={info.bizRegNo} />
          <LegalRow label="법인등록번호" value={info.corpRegNo} />
          <LegalRow label="주소" value={info.address} />
          <LegalRow label="업태/종목" value={`${info.bizType} / ${info.bizItem}`} />
          <LegalRow label="통신판매중개업 신고번호" value={info.mailOrderRegNo} />
          <LegalRow label="개인정보 보호책임자" value={info.privacyOfficer} />
          <LegalRow label="보험 모집인 등록번호" value={info.insuranceAgentRegNo} />
          <LegalRow label="상조 선불식 할부거래업 등록번호" value={info.funeralInstallmentRegNo} />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {snsLinks.map((sns) =>
            sns.enabled && sns.url ? (
              <a
                key={sns.platform}
                href={sns.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {sns.label}
              </a>
            ) : (
              <span key={sns.platform}>{sns.label} (오픈 예정)</span>
            ),
          )}
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
          © {new Date().getFullYear()} {info.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
