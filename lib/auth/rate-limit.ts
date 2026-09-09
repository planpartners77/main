import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MINUTES = 15;
// 계정(식별자) 단위는 빡빡하게, IP 단위는 느슨하게 — 통신사 CGNAT(다수 이용자가 같은 IP를
// 공유)로 인한 오탐(정상 이용자 차단)을 피하기 위함. IP 단위는 "명백한 무차별 대입"만 잡는다.
const MAX_FAILURES_PER_IDENTIFIER = 5;
const MAX_FAILURES_PER_IP = 20;

// login_events(0036)는 select가 super_admin RLS로 막혀 있어, 이 내부 판단 로직은 서버
// service role로 조회한다(응답으로는 blocked 여부/사유만 내보내고 원본 로그는 노출하지 않음).
export async function checkLoginRateLimit(params: {
  identifier?: string | null;
  ip: string | null;
}): Promise<{ blocked: boolean; reason?: string }> {
  const admin = createAdminClient();
  const since = new Date(new Date().getTime() - WINDOW_MINUTES * 60 * 1000).toISOString();

  if (params.identifier) {
    const { count } = await admin
      .from("login_events")
      .select("id", { count: "exact", head: true })
      .eq("result", "failure")
      .eq("identifier", params.identifier)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_FAILURES_PER_IDENTIFIER) {
      return { blocked: true, reason: "too_many_attempts_identifier" };
    }
  }

  if (params.ip) {
    const { count } = await admin
      .from("login_events")
      .select("id", { count: "exact", head: true })
      .eq("result", "failure")
      .eq("ip", params.ip)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_FAILURES_PER_IP) {
      return { blocked: true, reason: "too_many_attempts_ip" };
    }
  }

  return { blocked: false };
}
