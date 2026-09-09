import { createClient } from "@/lib/supabase/server";

export type LoginProvider = "email" | "kakao" | "admin";
export type LoginResult = "success" | "failure";

// login_events(0036)에 로그인 시도를 기록한다. insert는 RLS에서 누구나 허용되므로 여기서는
// 익명 서버 클라이언트로 충분하다(관리자 조회만 super_admin으로 제한됨).
export async function logLoginEvent(params: {
  provider: LoginProvider;
  result: LoginResult;
  ip: string | null;
  userAgent: string | null;
  userId?: string | null;
  identifier?: string | null;
  failureReason?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("login_events").insert({
    user_id: params.userId ?? null,
    identifier: params.identifier ?? null,
    provider: params.provider,
    result: params.result,
    failure_reason: params.failureReason ?? null,
    ip: params.ip,
    user_agent: params.userAgent,
  });
}
