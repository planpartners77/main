import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";

const MODULES = [
  { title: "리드 관리", desc: "카테고리별 신청/상담 리드 목록", href: "#" },
  { title: "상품·파트너 관리", desc: "제휴사·상품·요율 관리", href: "#" },
  { title: "추천인 코드", desc: "다단계 추천인 트리·정산 조건", href: "#" },
  { title: "정산", desc: "파트너별 정산 내역", href: "#" },
  { title: "콘텐츠", desc: "리뷰 승인, 꿀팁 콘텐츠 관리", href: "#" },
  { title: "고객 CS", desc: "상담 이력, 해지/철회 처리", href: "#" },
];

// Phase 4에서 각 모듈을 실제 화면으로 구현 예정. 지금은 role/managed_categories 기반
// 접근 제어를 어디에 걸지 보여주는 골격만 제공한다.
export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--brand-navy)]">관리자 대시보드</h1>
      {session && session.managedCategories.length > 0 && (
        <p className="mt-1 text-sm text-gray-500">
          담당 카테고리: {session.managedCategories.join(", ")}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-[var(--brand-navy)] hover:shadow-sm"
          >
            <h2 className="font-semibold">{module.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{module.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
