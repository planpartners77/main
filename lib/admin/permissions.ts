// 관리자 등급(10종)별 메뉴 접근 권한의 단일 소스. proxy.ts(라우트 차단)와
// AdminSidebar.tsx(메뉴 노출)가 모두 이 파일을 참조해 "숨겨져 있지만 URL로는 들어가지는"
// 구멍이 생기지 않게 한다. category_manager는 이 표와 별개로 is_admin_for_category
// (0002_rls.sql)를 통해 담당 카테고리 데이터로 한 번 더 좁혀진다.
export const ADMIN_ROLES = [
  "super_admin",
  "category_manager",
  "cs_agent",
  "settlement_manager",
  "content_manager",
  "member_manager",
  "product_manager",
  "marketing_manager",
  "operations_manager",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "최고 관리자",
  category_manager: "카테고리 매니저",
  cs_agent: "CS 상담사",
  settlement_manager: "정산 담당",
  content_manager: "콘텐츠 담당",
  member_manager: "회원 담당",
  product_manager: "상품 담당",
  marketing_manager: "마케팅 담당",
  operations_manager: "운영 담당",
  viewer: "조회 전용",
};

export const MENU_KEYS = [
  "dashboard",
  "statistics",
  "products",
  "partners",
  "leads",
  "settlements",
  "members",
  "referrals",
  "coupons",
  "design",
  "consultations",
  "stores",
  "seo",
  "admins",
] as const;

export type MenuKey = (typeof MENU_KEYS)[number];

const ROLE_MENUS: Record<AdminRole, MenuKey[]> = {
  super_admin: [...MENU_KEYS],
  category_manager: ["dashboard", "products", "partners", "leads"],
  cs_agent: ["dashboard", "leads", "consultations"],
  settlement_manager: ["dashboard", "settlements"],
  content_manager: ["dashboard", "design", "seo"],
  member_manager: ["dashboard", "members", "referrals", "coupons"],
  product_manager: ["dashboard", "products", "partners"],
  marketing_manager: ["dashboard", "statistics", "referrals", "coupons", "seo"],
  operations_manager: ["dashboard", "stores"],
  viewer: ["dashboard", "statistics"],
};

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function canAccessMenu(role: string, menu: MenuKey): boolean {
  if (!isAdminRole(role)) return false;
  return ROLE_MENUS[role].includes(menu);
}

export function menusForRole(role: string): MenuKey[] {
  if (!isAdminRole(role)) return [];
  return ROLE_MENUS[role];
}

// pathname -> 메뉴 키. 가장 긴(구체적인) prefix가 우선 매치되도록 정렬해 둔다
// (예: "/admin/design"과 "/admin/design/banners"가 둘 다 존재해도 design으로만 매칭).
const PATH_TO_MENU_ENTRIES: [string, MenuKey][] = [
  ["/admin/statistics", "statistics"],
  ["/admin/products", "products"],
  ["/admin/partners", "partners"],
  ["/admin/leads", "leads"],
  ["/admin/settlements", "settlements"],
  ["/admin/members", "members"],
  ["/admin/referrals", "referrals"],
  ["/admin/coupons", "coupons"],
  ["/admin/design", "design"],
  ["/admin/consultations", "consultations"],
  ["/admin/stores", "stores"],
  ["/admin/seo", "seo"],
  ["/admin/admins", "admins"],
];
const PATH_TO_MENU = [...PATH_TO_MENU_ENTRIES].sort((a, b) => b[0].length - a[0].length);

// "/admin" 정확히 그 경로(대시보드)는 어떤 등급이든 접근 가능 — 별도 메뉴 키 없이 통과시킨다.
export function menuKeyForPath(pathname: string): MenuKey | null {
  const match = PATH_TO_MENU.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? match[1] : null;
}
