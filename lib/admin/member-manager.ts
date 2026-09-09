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
