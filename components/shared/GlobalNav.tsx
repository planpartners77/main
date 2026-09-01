"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { CategoryConfig, SubCategoryConfig } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { CategoryDropdown } from "@/components/shared/CategoryDropdown";

function ConsultTag() {
  return (
    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
      상담 필수
    </span>
  );
}

// 모바일 햄버거 드로어 전용: CategoryDropdown(호버 플라이아웃)과 달리 항상 펼쳐진
// 들여쓰기 목록으로 하위카테고리를 재귀 렌더링(터치 환경엔 호버가 없어서).
function MobileSubMenu({
  items,
  depth,
  onNavigate,
}: {
  items: SubCategoryConfig[];
  depth: number;
  onNavigate: () => void;
}) {
  return (
    <ul className="space-y-0.5" style={{ paddingLeft: depth * 12 }}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="block rounded-lg px-2 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-[var(--brand-blue)]"
          >
            {item.name}
          </Link>
          {item.subcategories && (
            <MobileSubMenu items={item.subcategories} depth={depth + 1} onNavigate={onNavigate} />
          )}
        </li>
      ))}
    </ul>
  );
}

// 가이드 §12-2: 상단 GNB(데스크톱) + 하단 고정 탭바(모바일)로 전환되는 반응형 네비게이션.
// categories는 관리자 "카테고리 진열순서" 설정이 반영된 순서로 상위(레이아웃)에서 내려준다.
export function GlobalNav({ categories }: { categories: CategoryConfig[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="hidden border-b border-gray-200 bg-white md:block">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.jpg"
              alt="플랜파트너스"
              width={483}
              height={258}
              priority
              className="h-16 w-auto"
            />
          </Link>

          <ul className="flex items-center gap-5 text-sm">
            {categories.map((category) => {
              const href = `/${category.slug}`;
              const isActive = pathname === href;
              return (
                <li key={category.slug} className="group relative">
                  <Link
                    href={href}
                    className={
                      isActive
                        ? "font-semibold text-[var(--brand-blue)]"
                        : "text-gray-600 hover:text-[var(--brand-blue)]"
                    }
                  >
                    {category.name}
                    {category.trackType === "consult_required" && <ConsultTag />}
                  </Link>

                  {category.subcategories && (
                    <div className="pointer-events-none absolute left-1/2 top-full z-20 -translate-x-1/2 pt-3 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                      <CategoryDropdown items={category.subcategories} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 text-sm">
            <Link href="/mypage" className="text-gray-600 hover:text-[var(--brand-blue)]">
              마이페이지
            </Link>
            <Link href="/signup" className="text-gray-600 hover:text-[var(--brand-blue)]">
              회원가입
            </Link>
            {/* 카카오싱크 심사 완료 전까지 이메일/비밀번호 로그인으로 임시 대체(§12-9는 원래 카카오 로그인 모달 계획) */}
            {loggedIn ? (
              <button
                onClick={handleSignOut}
                className="rounded-full border border-gray-200 px-4 py-1.5 font-medium text-gray-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 font-medium text-white hover:bg-[var(--brand-blue-dark)]"
              >
                로그인
              </Link>
            )}
          </div>
        </nav>
      </header>

      <header className="relative flex items-center justify-center border-b border-gray-200 bg-white px-4 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴 열기"
          className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1"
        >
          <span className="h-0.5 w-5 rounded-full bg-[var(--brand-navy)]" />
          <span className="h-0.5 w-5 rounded-full bg-[var(--brand-navy)]" />
          <span className="h-0.5 w-5 rounded-full bg-[var(--brand-navy)]" />
        </button>

        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.jpg"
            alt="플랜파트너스"
            width={483}
            height={258}
            priority
            className="h-11 w-auto"
          />
        </Link>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[80%] flex-col overflow-y-auto bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--brand-navy)]">메뉴</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="닫기"
                className="text-xl leading-none text-gray-400"
              >
                &times;
              </button>
            </div>

            <ul className="mt-6 space-y-1 text-sm">
              {categories.map((category) => {
                const href = `/${category.slug}`;
                const isActive = pathname === href;
                return (
                  <li key={category.slug}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={
                        isActive
                          ? "flex items-center rounded-lg bg-[var(--surface-tint)] px-2 py-2.5 font-semibold text-[var(--brand-blue)]"
                          : "flex items-center rounded-lg px-2 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                      }
                    >
                      {category.name}
                      {category.trackType === "consult_required" && <ConsultTag />}
                    </Link>
                    {category.subcategories && (
                      <MobileSubMenu
                        items={category.subcategories}
                        depth={1}
                        onNavigate={() => setMenuOpen(false)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 space-y-1 border-t border-gray-100 pt-4 text-sm">
              <Link
                href="/mypage"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                마이페이지
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                회원가입
              </Link>
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full rounded-lg px-2 py-2.5 text-left font-medium text-gray-700 hover:bg-gray-50"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-full bg-[var(--brand-blue)] px-2 py-2.5 text-center font-medium text-white"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white md:hidden">
        <Link href="/" className="flex flex-1 flex-col items-center py-2 text-xs text-gray-600">
          홈
        </Link>
        {/* Phase 2(§12-3)의 "내 지원금 확인하기" 진입 플로우가 만들어지면 그 라우트로 교체 */}
        <Link href="/" className="flex flex-1 flex-col items-center py-2 text-xs text-gray-600">
          맞춤 상품찾기
        </Link>
        <Link
          href="/mypage"
          className="flex flex-1 flex-col items-center py-2 text-xs text-gray-600"
        >
          마이페이지
        </Link>
      </nav>
    </>
  );
}
