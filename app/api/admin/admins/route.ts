import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin/permissions";

// 관리자 계정 생성/등급변경/권한해제는 반드시 이 라우트(서비스 롤 키)를 통해서만 이뤄진다.
// admin_users에는 애초에 insert/update/delete RLS 정책이 없다(0003_rls_gaps.sql 원칙) —
// 로그인한 사용자가 클라이언트에서 직접 자신의 권한을 바꾸는 경로를 원천 차단하기 위함이며,
// 이 라우트가 그 유일한 예외 통로다. 매 요청마다 호출자가 super_admin인지 다시 확인한다.
async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminUser?.role !== "super_admin") return null;
  return user;
}

async function countOtherSuperAdmins(excludeId: string) {
  const { count } = await createAdminClient()
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .neq("id", excludeId);
  return count ?? 0;
}

export async function POST(request: Request) {
  const actor = await requireSuperAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { email?: string; role?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role as AdminRole | undefined;

  if (!email || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Admin API에 이메일 단건 조회가 없어(getUserByEmail 미제공) listUsers로 찾는다.
  // 회원 목록 화면과 동일하게 최대 1000명까지만 커버한다.
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const targetUser = usersData?.users.find((u) => u.email?.toLowerCase() === email);

  if (!targetUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("admin_users")
    .insert({ id: targetUser.id, role, managed_categories: [] });

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const actor = await requireSuperAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    role?: string;
    managedCategories?: string[];
  } | null;
  const { id, role, managedCategories } = body ?? {};

  if (!id || !role || !ADMIN_ROLES.includes(role as AdminRole)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (role !== "super_admin" && (await countOtherSuperAdmins(id)) === 0) {
    return NextResponse.json({ error: "last_super_admin" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("admin_users")
    .update({ role, managed_categories: managedCategories ?? [] })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const actor = await requireSuperAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  if ((await countOtherSuperAdmins(id)) === 0) {
    const { data: target } = await createAdminClient()
      .from("admin_users")
      .select("role")
      .eq("id", id)
      .single();
    if (target?.role === "super_admin") {
      return NextResponse.json({ error: "last_super_admin" }, { status: 400 });
    }
  }

  const { error } = await createAdminClient().from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
