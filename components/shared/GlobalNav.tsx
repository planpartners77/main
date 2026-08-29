"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

function ConsultTag() {
  return (
    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
      상담 필수
    </span>
  );
}

// 가이드 §12-2: 상단 GNB(데스크톱) + 하단 고정 탭바(모바일)로 전환되는 반응형 네비게이션.
export function GlobalNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="hidden border-b border-gray-200 bg-white md:block">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-[var(--brand-navy)]">
            플랜파트너스
          </Link>

          <ul className="flex items-center gap-5 text-sm">
            {CATEGORIES.map((category) => {
              const href = `/${category.slug}`;
              const isActive = pathname === href;
              return (
                <li key={category.slug}>
                  <Link
                    href={href}
                    className={
                      isActive
                        ? "font-semibold text-[var(--brand-navy)]"
                        : "text-gray-600 hover:text-[var(--brand-navy)]"
                    }
                  >
                    {category.name}
                    {category.trackType === "consult_required" && <ConsultTag />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 text-sm">
            <Link href="/mypage" className="text-gray-600 hover:text-[var(--brand-navy)]">
              마이페이지
            </Link>
            {/* Phase 3(§12-9)에서 카카오 로그인 모달로 교체 */}
            <button className="rounded-full bg-[var(--brand-navy)] px-4 py-1.5 font-medium text-white">
              로그인
            </button>
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
