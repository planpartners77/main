import { BUSINESS_INFO } from "./business-info";

// §7 컴플라이언스 체크리스트 대상 문서. 실제 등록된 사업자정보(BUSINESS_INFO)만 인용하며,
// 아직 확정되지 않은 항목(개인정보 보호책임자 등)은 지어내지 않고 "등록 후 반영 예정"으로 둔다.
// 법률 검토 전 초안이므로 각 페이지 상단에 그 사실을 명시한다.
export type LegalDocSlug = "privacy" | "terms" | "marketing-consent" | "email-collection-refusal";

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  slug: LegalDocSlug;
  title: string;
  intro: string;
  sections: LegalSection[];
}

const EFFECTIVE_DATE = "2026-08-31";

export const LEGAL_DOCS: Record<LegalDocSlug, LegalDoc> = {
  terms: {
    slug: "terms",
    title: "서비스 이용약관",
    intro: `본 약관은 ${BUSINESS_INFO.companyName}(이하 "회사")가 제공하는 비교·중개 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
    sections: [
      {
        heading: "제1조 (목적)",
        body: [
          "이 약관은 회사가 운영하는 웹사이트를 통해 제공하는 인터넷·휴대폰·가전렌탈·여행·보험·상조 등 각종 상품 비교·중개 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정합니다.",
        ],
      },
      {
        heading: "제2조 (회사의 지위)",
        body: [
          "회사는 통신판매중개자로서 통신판매의 당사자가 아니며, 파트너사가 등록·제공한 상품 정보의 정확성이나 파트너사와 이용자 간 거래에 대해 원칙적으로 책임을 지지 않습니다.",
          "회사는 이용자가 안전하게 비교·신청할 수 있도록 관련 법령이 정하는 범위 내에서 최선의 노력을 다합니다.",
        ],
      },
      {
        heading: "제3조 (회원가입)",
        body: [
          "이용자는 회사가 정한 절차에 따라 회원가입을 신청하며, 회사는 이용자의 신청에 대해 서비스 이용을 승낙함을 원칙으로 합니다.",
          "회원은 가입 시 등록한 정보에 변경이 있는 경우 마이페이지 등을 통해 지체 없이 변경사항을 반영해야 합니다.",
        ],
      },
      {
        heading: "제4조 (서비스 이용)",
        body: [
          "이용자는 회사가 제공하는 비교 정보를 참고하여 각 파트너사와 개별적으로 거래를 진행하며, 최종 계약 체결에 대한 판단과 책임은 이용자 본인에게 있습니다.",
          "회사는 시스템 점검, 장애, 천재지변 등 불가피한 사유가 있는 경우 서비스 제공을 일시 중단할 수 있습니다.",
        ],
      },
      {
        heading: "제5조 (면책조항)",
        body: [
          "회사는 이용자와 파트너사 간에 서비스를 매개로 발생한 거래와 관련하여 판매의사·구매의사의 진정성, 등록된 상품의 품질·완전성·적법성 등을 보증하지 않으며, 그와 관련한 위험과 책임은 해당 거래의 당사자가 부담합니다.",
        ],
      },
      {
        heading: "부칙",
        body: [`본 약관은 ${EFFECTIVE_DATE}부터 시행됩니다.`],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "개인정보처리방침",
    intro: `${BUSINESS_INFO.companyName}(이하 "회사")는 개인정보보호법 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.`,
    sections: [
      {
        heading: "1. 수집하는 개인정보 항목 및 수집 방법",
        body: [
          "회원가입 시: 이메일, 비밀번호, 이름, 휴대폰번호",
          "상품 신청·상담 접수 시: 이름, 연락처, 주소 등 신청서에 기재한 정보",
          "서비스 이용 과정에서 IP주소, 쿠키, 접속 로그 등이 자동으로 생성되어 수집될 수 있습니다.",
        ],
      },
      {
        heading: "2. 개인정보의 수집 및 이용 목적",
        body: [
          "회원 관리(본인확인, 부정이용 방지), 서비스 제공(상품 비교·신청·상담 연결), 마케팅 정보 수신에 동의한 이용자에 대한 이벤트·혜택 안내",
        ],
      },
      {
        heading: "3. 개인정보의 보유 및 이용기간",
        body: [
          "회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 관계 법령의 규정에 따라 보존할 필요가 있는 경우 회사는 관계 법령에서 정한 기간 동안 회원정보를 보관합니다.",
        ],
      },
      {
        heading: "4. 개인정보의 제3자 제공",
        body: [
          "이용자가 상품 신청·상담을 요청한 경우, 해당 처리를 위해 필요한 최소한의 정보가 관련 파트너사(통신사·보험사·상조회사 등)에 제공될 수 있습니다. 이 경우 제공받는 자, 제공 목적, 제공 항목, 보유·이용기간을 이용자에게 사전 고지하고 동의를 받습니다.",
        ],
      },
      {
        heading: "5. 이용자의 권리와 행사 방법",
        body: [
          "이용자는 언제든지 마이페이지를 통해 자신의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴(수집·이용 동의 철회)를 요청할 수 있습니다.",
        ],
      },
      {
        heading: "6. 개인정보 보호책임자",
        body: [
          BUSINESS_INFO.privacyOfficer
            ? `개인정보 보호책임자: ${BUSINESS_INFO.privacyOfficer}`
            : "개인정보 보호책임자는 지정·신고 완료 후 이 페이지에 공개됩니다.",
        ],
      },
      {
        heading: "부칙",
        body: [`본 방침은 ${EFFECTIVE_DATE}부터 시행됩니다.`],
      },
    ],
  },
  "marketing-consent": {
    slug: "marketing-consent",
    title: "마케팅 정보 수신 동의",
    intro: `${BUSINESS_INFO.companyName}는 이벤트, 혜택, 신규 서비스 등 광고성 정보를 문자(SMS)·이메일·앱 푸시 등으로 안내하기 위해 아래와 같이 수신 동의를 받고 있습니다. 본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.`,
    sections: [
      { heading: "1. 수집·이용 목적", body: ["광고성 정보(이벤트, 프로모션, 신규 상품·서비스 안내 등) 전송"] },
      { heading: "2. 수신 방법", body: ["문자메시지(SMS/알림톡), 이메일, 앱·웹 푸시 알림"] },
      { heading: "3. 보유 및 이용 기간", body: ["회원 탈퇴 시 또는 수신 동의 철회 시까지"] },
      {
        heading: "4. 동의 철회",
        body: ["마이페이지의 알림 설정 메뉴 또는 수신한 메시지 내 수신거부 절차를 통해 언제든지 동의를 철회할 수 있습니다."],
      },
    ],
  },
  "email-collection-refusal": {
    slug: "email-collection-refusal",
    title: "이메일 무단수집 거부",
    intro:
      "본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시 관련 법령에 의해 처벌될 수 있음을 유의하시기 바랍니다.",
    sections: [
      {
        heading: "관련 법령",
        body: [
          "「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조의2에 따라, 전자우편주소 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 이 웹사이트에 게시된 이메일 주소를 수집하는 행위는 금지됩니다.",
          "이를 위반하여 수집된 이메일 주소를 이용한 자는 관련 법령에 따라 처벌받을 수 있습니다.",
        ],
      },
    ],
  },
};

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS[slug as LegalDocSlug];
}

export const LEGAL_NAV: { slug: LegalDocSlug; label: string }[] = [
  { slug: "privacy", label: "개인정보처리방침" },
  { slug: "terms", label: "서비스 이용약관" },
  { slug: "marketing-consent", label: "마케팅 정보수신 동의" },
  { slug: "email-collection-refusal", label: "이메일 무단수집 거부" },
];
