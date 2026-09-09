"use client";

// 이메일/관리자 로그인은 클라이언트에서 signInWithPassword를 직접 호출해 서버를 거치지 않으므로
// 우리 서버가 IP를 볼 기회가 없다. 결과만 이 라우트로 알려주면 /api/auth/log-login-event가
// "이 요청 자체의" IP/UA로 login_events에 기록한다(같은 브라우저 요청이라 사실상 동일 IP).
// 실패해도 로그인 자체를 막으면 안 되므로 항상 fire-and-forget으로 삼킨다.
export function reportLoginEvent(params: {
  provider: "email" | "admin";
  result: "success" | "failure";
  identifier?: string;
  userId?: string;
  failureReason?: string;
}) {
  fetch("/api/auth/log-login-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    keepalive: true,
  }).catch(() => {});
}
