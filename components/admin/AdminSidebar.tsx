"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "./AdminIcon";
import { SignOutButton } from "./SignOutButton";
import { ADMIN_ROLE_LABELS, canAccessMenu, isAdminRole, menuKeyForPath } from "@/lib/admin/permissions";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// Phase 4 로드맵(§ 관리자 대시보드 6개 모듈) 기준 그룹핑. 아직 화면이 없는 모듈은 href="#"로
// 자리만 잡아두고, 실제 구현되는 대로 여기 href만 바꾸면 된다.
const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: "대시보드", href: "/admin", icon: "dashboard" }] },
  { label: "통계", items: [{ title: "통계", href: "/admin/statistics", icon: "stats" }] },
  {
    label: "상품·파트너",
    items: [
      { title: "상품 관리", href: "/admin/products", icon: "product" },
      { title: "파트너 관리", href: "/admin/partners", icon: "partner" },
    ],
  },
  {
    label: "리드·정산",
    items: [
      { title: "리드 관리", href: "/admin/leads", icon: "leads" },
      { title: "정산", href: "/admin/settlements", icon: "settlement" },
    ],
  },
  {
    label: "회원",
    items: [
      { title: "회원 관리", href: "/admin/members", icon: "member" },
      { title: "추천인 코드", href: "/admin/referrals", icon: "referral" },
      { title: "쿠폰 관리", href: "/admin/coupons", icon: "coupon" },
    ],
  },
  {
    label: "콘텐츠·CS",
    items: [
      { title: "디자인관리", href: "/admin/design", icon: "content" },
      { title: "고객 CS", href: "/admin/consultations", icon: "cs" },
    ],
  },
  { label: "운영", items: [{ title: "매장 관리", href: "/admin/stores", icon: "settings" }] },
  { label: "SEO", items: [{ title: "SEO 관리", href: "/admin/seo", icon: "seo" }] },
  { label: "시스템", items: [{ title: "관리자 관리", href: "/admin/admins", icon: "settings" }] },
];

function roleLabel(role: string): string {
  return isAdminRole(role) ? ADMIN_ROLE_LABELS[role] : role;
}

// 등급별 접근 불가 메뉴는 아예 숨긴다(lib/admin/permissions.ts). 대시보드처럼 메뉴 키가
// 없는 항목(menuKeyForPath가 null)은 모든 등급에 항상 노출된다.
function visibleNavGroups(role: string): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const menu = menuKeyForPath(item.href);
      return !menu || canAccessMenu(role, menu);
    }),
  })).filter((group) => group.items.length > 0);
}

function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();
  const groups = visibleNavGroups(role);
  return (
    <>
      {groups.map((group) => (
        <div key={group.label ?? "root"}>
          {group.label && (
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-white/30">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href !== "#" &&
                (pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)));
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-white/10 font-semibold text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <AdminIcon name={item.icon} className="h-4 w-4 shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminSidebar({
  role,
  displayName,
}: {
  role: string;
  displayName: string;
}) {
  return (
    <>
      {/* 데스크톱: 고정 좌측 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[#12182b] text-white md:flex">
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold tracking-widest text-white/40">ADMIN</p>
          <Link href="/admin" className="mt-1 block text-lg font-bold">
            플랜파트너스
          </Link>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          <NavLinks role={role} />
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-white/40">{roleLabel(role)}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* 모바일: 상단 바 + 가로 스크롤 메뉴 */}
      <div className="bg-[#12182b] text-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-bold">플랜파트너스 관리자</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
              {roleLabel(role)}
            </span>
          </div>
          <SignOutButton />
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2">
          {visibleNavGroups(role).flatMap((g) => g.items).map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
