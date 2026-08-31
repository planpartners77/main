import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 서버 전용 관리자 클라이언트(RLS 우회, service role 키 사용). 절대 클라이언트 번들에
// 포함되면 안 되므로 route handler 등 서버 코드에서만 import할 것.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
