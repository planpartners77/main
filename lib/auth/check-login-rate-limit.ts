"use client";

// 로그인 시도 전 /api/auth/check-rate-limit에 물어봐 최근 실패가 과도하면 아예 시도를 막는다
// (§보안 2단계). 네트워크 오류 등으로 확인 자체가 실패하면 로그인을 막지 않는다(가용성 우선).
export async function isLoginRateLimited(params: {
  provider: "email" | "admin";
  identifier: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/check-rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { blocked?: boolean };
    return data.blocked === true;
  } catch {
    return false;
  }
}
