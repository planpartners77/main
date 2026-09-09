import { createClient } from "@/lib/supabase/server";

export async function requireMemberManager() {
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

  if (!adminUser || !["super_admin", "member_manager"].includes(adminUser.role as string)) return null;
  return user;
}

// 즉시 물리 삭제(개인정보 삭제 요구권 대응)는 되돌릴 수 없고 다른 회원의 추천인 트리에도
// 영향을 줄 수 있어 super_admin으로만 제한한다(member_manager는 소프트삭제까지만 허용).
export async function requireSuperAdmin() {
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

  if (!adminUser || adminUser.role !== "super_admin") return null;
  return user;
}
