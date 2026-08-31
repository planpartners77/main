import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar role={session.role} displayName={session.displayName ?? session.email ?? "관리자"} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
