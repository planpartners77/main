import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { SignOutButton } from "@/components/admin/SignOutButton";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "최고 관리자",
  category_manager: "카테고리 매니저",
  cs_agent: "CS 상담사",
  settlement_manager: "정산 담당",
  content_manager: "콘텐츠 담당",
};

// /admin/login을 제외한 관리자 화면 전용 쉘. proxy.ts가 1차로 접근을 막고,
// 여기서 다시 한번 세션을 확인해 방어적으로 리다이렉트한다(방어 이중화).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between bg-[var(--brand-navy)] px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-bold">플랜파트너스 관리자</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
            {ROLE_LABELS[session.role] ?? session.role}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span>{session.displayName ?? session.email}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
