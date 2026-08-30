import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string | null;
  role: string;
  managedCategories: string[];
  displayName: string | null;
}

// admin_users에 role이 있는 계정만 세션을 반환한다. profiles.id도 동일한 auth.users(id)를
// 참조하므로, 고객으로 이미 가입한 계정에 admin_users row만 추가하면 동일한 이메일/비밀번호로
// /admin에 진입할 수 있다 — customer_tiers는 이 판단에 전혀 관여하지 않는다(관리자 권한과
// 고객 등급을 분리한 §11 원칙 유지).
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, managed_categories")
    .eq("id", user.id)
    .single();

  if (!adminUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: adminUser.role as string,
    managedCategories: (adminUser.managed_categories as string[] | null) ?? [],
    displayName: profile?.display_name ?? null,
  };
});
