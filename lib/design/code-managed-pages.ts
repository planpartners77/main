// "디자인관리 > 페이지"(pages 테이블)는 홈 화면 등 섹션 조립형 페이지만 관리한다.
// 휴대폰/유심/약관 등 나머지 화면은 코드에 고정 라우트로 존재하며 각자의 전용 관리 화면에서
// 데이터를 편집한다 — 이 화면은 그 현황을 안내만 하는 정적 목록이라 DB 테이블이 필요 없다.
export interface CodeManagedPage {
  title: string;
  path: string;
  managedAt: string;
  managedHref?: string;
}

export interface CodeManagedPageGroup {
  label: string;
  description: string;
  pages: CodeManagedPage[];
}

export const CODE_MANAGED_PAGE_GROUPS: CodeManagedPageGroup[] = [
  {
    label: "콘텐츠 페이지",
    description: "각 전용 관리 화면에서 내용을 수정하면 아래 주소에 바로 반영됩니다.",
    pages: [
      { title: "회사소개", path: "/company", managedAt: "회사 정보 관리", managedHref: "/admin/company-info" },
      { title: "공지사항", path: "/notices", managedAt: "디자인관리 > 공지사항", managedHref: "/admin/design/notices" },
      { title: "이벤트", path: "/events", managedAt: "디자인관리 > 이벤트", managedHref: "/admin/design/events" },
      { title: "사은품 지급 명단", path: "/rewards", managedAt: "디자인관리 > 사은품 지급", managedHref: "/admin/design/rewards" },
      { title: "이용약관·정책", path: "/legal/{문서}", managedAt: "디자인관리 > 약관", managedHref: "/admin/design/legal" },
      { title: "매장 찾기", path: "/stores", managedAt: "관리 화면 준비중 (Phase 2)" },
    ],
  },
  {
    label: "카테고리·상품 페이지",
    description: "상품 데이터는 상품관리에서, 카테고리 노출 여부는 카테고리관리에서 제어합니다.",
    pages: [
      { title: "휴대폰", path: "/mobile", managedAt: "상품관리", managedHref: "/admin/products" },
      { title: "유심", path: "/usim", managedAt: "상품관리", managedHref: "/admin/products" },
      { title: "보험", path: "/insurance", managedAt: "상품관리", managedHref: "/admin/products" },
      { title: "여행", path: "/travel", managedAt: "상품관리", managedHref: "/admin/products" },
      { title: "인터넷", path: "/internet", managedAt: "준비중 화면 (카테고리관리에서 노출 제어)", managedHref: "/admin/design/categories" },
      { title: "상조", path: "/funeral", managedAt: "준비중 화면 (카테고리관리에서 노출 제어)", managedHref: "/admin/design/categories" },
      { title: "렌탈", path: "/rental", managedAt: "준비중 화면 (카테고리관리에서 노출 제어)", managedHref: "/admin/design/categories" },
      { title: "기타 카테고리", path: "/{카테고리}", managedAt: "카테고리관리", managedHref: "/admin/design/categories" },
    ],
  },
  {
    label: "기능 페이지",
    description: "상담·가입·비교 등 진행 흐름을 담당하는 화면으로, 별도 콘텐츠 관리가 필요하지 않습니다.",
    pages: [
      { title: "상담신청", path: "/consult/{카테고리}", managedAt: "콘텐츠 관리 대상 아님" },
      { title: "가입신청", path: "/apply/{카테고리}", managedAt: "콘텐츠 관리 대상 아님" },
      { title: "상품비교", path: "/compare/{카테고리}", managedAt: "콘텐츠 관리 대상 아님" },
      { title: "진단퀴즈", path: "/quiz/{카테고리}", managedAt: "콘텐츠 관리 대상 아님" },
      { title: "마이페이지", path: "/mypage", managedAt: "콘텐츠 관리 대상 아님" },
      { title: "로그인 / 회원가입 / 비밀번호 재설정 / 계정정지 안내", path: "/login 외 3종", managedAt: "콘텐츠 관리 대상 아님" },
    ],
  },
];
