import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin/session";
import { AdminUserManager } from "@/components/admin/admins/AdminUserManager";

interface AdminUserRow {
  id: string;
  role: string;
  managed_categories: string[] | null;
}

export default async function AdminAccountsPage() {
  const session = await getAdminSession();
  // proxy.ts가 1차로 막지만(admins 메뉴는 super_admin 전용), 계정 생성 화면은
  // 방어 이중화가 필요한 민감 기능이라 여기서도 한 번 더 확인한다.
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { data: adminUsersData } = await supabase
    .from("admin_users")
    .select("id, role, managed_categories");
  const adminUsers = (adminUsersData ?? []) as AdminUserRow[];

  const { data: categoriesData } = await supabase.from("categories").select("id, name").order("name");

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? "-"]));

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", adminUsers.map((a) => a.id));
  const nameById = new Map((profilesData ?? []).map((p) => [p.id, p.display_name]));

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">관리자 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        관리자 등급은 10종이며, 등급별로 접근 가능한 메뉴가 다릅니다. 최고 관리자만 이 화면을 사용할 수 있습니다.
      </p>

      <AdminUserManager
        currentUserId={session.userId}
        categories={categoriesData ?? []}
        admins={adminUsers.map((a) => ({
          id: a.id,
          role: a.role,
          managedCategories: a.managed_categories ?? [],
          email: emailById.get(a.id) ?? "-",
          displayName: nameById.get(a.id) ?? null,
        }))}
      />
    </div>
  );
}
