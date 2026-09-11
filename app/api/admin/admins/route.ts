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

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    role?: string;
    managedCategories?: string[];
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role as AdminRole | undefined;
  const managedCategories = body?.managedCategories ?? [];

  if (!email || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // 카테고리 매니저는 담당 카테고리를 명시적으로 선택해야 한다 — 빈 배열로 만들면
  // is_admin_for_category가 항상 false라 아무 카테고리도 못 보는 채로 방치되기 쉽다.
  if (role === "category_manager" && managedCategories.length === 0) {
    return NextResponse.json({ error: "category_required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 예전엔 listUsers({perPage:1000})로 이메일을 찾았는데(Admin API에 getUserByEmail이 없어서),
  // 회원이 1000명을 넘으면 뒷 페이지 회원은 아예 못 찾는 버그였다. profiles.email(0039 마이그레이션,
  // auth.users와 트리거로 동기화)을 직접 조회하면 회원 수와 무관하게 정확히 찾는다.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("admin_users")
    .insert({ id: targetProfile.id, role, managed_categories: role === "category_manager" ? managedCategories : [] });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_admin" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  if (role === "category_manager" && (managedCategories ?? []).length === 0) {
    return NextResponse.json({ error: "category_required" }, { status: 400 });
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
