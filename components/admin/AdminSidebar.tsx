"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

export interface LeadCategoryNavOption {
  id: string;
  slug: string;
  name: string;
}

// Phase 4 로드맵(§ 관리자 대시보드 6개 모듈) 기준 그룹핑. 아직 화면이 없는 모듈은 href="#"로
// 자리만 잡아두고, 실제 구현되는 대로 여기 href만 바꾸면 된다.
// "신청 내역"(카테고리별 리드 목록)은 카테고리가 늘어날 때마다 코드 수정 없이 반영되도록
// 여기 정적 배열이 아니라 buildLeadsGroup()에서 DB 카테고리 목록으로 동적 생성한다.
const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: "대시보드", href: "/admin", icon: "dashboard" }] },
  {
    label: "상품·파트너",
    items: [
      { title: "상품관리", href: "/admin/products", icon: "product" },
      { title: "알뜰폰_프로모션", href: "/admin/usim-promotions", icon: "product" },
      { title: "공급자 관리", href: "/admin/partners", icon: "partner" },
    ],
  },
  {
    label: "정산",
    items: [{ title: "정산", href: "/admin/settlements", icon: "settlement" }],
  },
  {
    label: "회원",
    items: [
      { title: "회원 관리", href: "/admin/members", icon: "member" },
      { title: "회원 등급", href: "/admin/tiers", icon: "tier" },
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
  {
    label: "회사 정보",
    items: [{ title: "회사 정보 관리", href: "/admin/company-info", icon: "content" }],
  },
  {
    label: "시스템",
    items: [
      { title: "통계", href: "/admin/statistics", icon: "stats" },
      { title: "보안", href: "/admin/security", icon: "shield" },
      { title: "관리자 관리", href: "/admin/admins", icon: "settings" },
      { title: "간편로그인 관리", href: "/admin/login-methods", icon: "login-key" },
    ],
  },
];

function roleLabel(role: string): string {
  return isAdminRole(role) ? ADMIN_ROLE_LABELS[role] : role;
}

// "신청 내역"은 카테고리 수만큼 항목이 늘어나므로 정적 NAV_GROUPS 대신 여기서 매 요청마다
// 조립한다. category_manager는 담당 카테고리(managedCategories, 카테고리 id 배열)만 볼 수 있게
// 좁힌다 — 그 외 등급(super_admin/cs_agent 등 leads 메뉴 접근 권한이 있는 등급)은 전체 노출.
// RLS(is_admin_for_category)가 데이터는 이미 막아주지만, 어차피 빈 화면만 보일 메뉴 항목을
// 굳이 보여줘 혼란을 주지 않기 위한 UX상의 추가 필터링이다.
function buildLeadsGroup(
  role: string,
  leadCategories: LeadCategoryNavOption[],
  managedCategories: string[],
): NavGroup {
  const visibleCategories =
    role === "category_manager"
      ? leadCategories.filter((category) => managedCategories.includes(category.id))
      : leadCategories;

  return {
    label: "신청 내역",
    items: [
      { title: "전체", href: "/admin/leads", icon: "leads" },
      ...visibleCategories.map((category) => ({
        title: category.name,
        href: `/admin/leads/${category.slug}`,
        icon: "leads",
      })),
    ],
  };
}

// 등급별 접근 불가 메뉴는 아예 숨긴다(lib/admin/permissions.ts). 대시보드처럼 메뉴 키가
// 없는 항목(menuKeyForPath가 null)은 모든 등급에 항상 노출된다.
function visibleNavGroups(
  role: string,
  leadCategories: LeadCategoryNavOption[],
  managedCategories: string[],
): NavGroup[] {
  const groups = [...NAV_GROUPS];
  groups.splice(2, 0, buildLeadsGroup(role, leadCategories, managedCategories));

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const menu = menuKeyForPath(item.href);
        return !menu || canAccessMenu(role, menu);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

const SIDEBAR_COLLAPSE_KEY = "admin-sidebar-collapsed-groups";

function NavLinks({
  role,
  leadCategories,
  managedCategories,
}: {
  role: string;
  leadCategories: LeadCategoryNavOption[];
  managedCategories: string[];
}) {
  const pathname = usePathname();
  const groups = visibleNavGroups(role, leadCategories, managedCategories);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 그룹이 많아지면서 한 화면에 다 안 들어와, 접힘 상태를 localStorage에 저장해
  // 다음 방문에도 유지되게 한다(관리자별 로컬 취향이라 서버 저장은 불필요).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setCollapsedGroups(JSON.parse(saved));
    } catch {
      // 저장된 값을 못 읽어도 기본값(전부 펼침)으로 동작
    }
  }, []);

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패해도 이번 화면에서 접고 펼치는 동작 자체는 그대로 유지
      }
      return next;
    });
  }

  return (
    <>
      {groups.map((group) => {
        const collapsed = group.label ? (collapsedGroups[group.label] ?? false) : false;
        return (
          <div key={group.label ?? "root"}>
            {group.label && (
              <button
                type="button"
                onClick={() => toggleGroup(group.label!)}
                className="flex w-full items-center justify-between px-3 pb-1.5 text-left text-[11px] font-semibold tracking-wider text-white/30 hover:text-white/50"
              >
                <span>{group.label}</span>
                <AdminIcon
                  name="chevron-down"
                  className={`h-3 w-3 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                />
              </button>
            )}
            {!collapsed && (
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
            )}
          </div>
        );
      })}
    </>
  );
}

export function AdminSidebar({
  role,
  displayName,
  leadCategories,
  managedCategories,
}: {
  role: string;
  displayName: string;
  leadCategories: LeadCategoryNavOption[];
  managedCategories: string[];
}) {
  return (
    <>
      {/* 데스크톱: 고정 좌측 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[#12182b] text-white md:flex">
        {/* 메인 사이트 Hero의 상단 그라디언트 바(브랜드 민트→블루)와 동일한 포인트 액센트 */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-[var(--brand-mint)] to-[var(--brand-blue)]" />
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold tracking-widest text-white/40">ADMIN</p>
          <Link href="/admin" className="mt-1 block text-lg font-bold">
            플랜파트너스
          </Link>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          <NavLinks role={role} leadCategories={leadCategories} managedCategories={managedCategories} />
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
        <nav className="flex gap-3 overflow-x-auto border-t border-white/10 px-3 py-2">
          {visibleNavGroups(role, leadCategories, managedCategories).map((group) => (
            <div key={group.label ?? "root"} className="flex shrink-0 items-center gap-1">
              {group.label && (
                <span className="shrink-0 pl-1 text-[10px] font-semibold tracking-wider text-white/30">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
