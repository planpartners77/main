"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CategoryConfig } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { CategoryDropdown } from "@/components/shared/CategoryDropdown";

function ConsultTag() {
  return (
    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
      상담 필수
    </span>
  );
}

// 가이드 §12-2: 상단 GNB(데스크톱) + 하단 고정 탭바(모바일)로 전환되는 반응형 네비게이션.
// categories는 관리자 "카테고리 진열순서" 설정이 반영된 순서로 상위(레이아웃)에서 내려준다.
export function GlobalNav({ categories }: { categories: CategoryConfig[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

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
          <Link href="/" className="text-lg font-bold text-[var(--brand-navy)]">
            플랜파트너스
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
