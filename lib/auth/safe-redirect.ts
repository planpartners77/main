// 로그인 후 "보던 페이지로 복귀" 기능에서 쓰는 next 경로 검증. 외부 도메인이나
// //evil.com, /\evil.com 같은 프로토콜 상대경로로 리다이렉트되는 오픈 리다이렉트를 막고,
// /login으로 되돌아가는 순환·API 라우트로의 리다이렉트도 막는다.
export function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.includes("://")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/api") || raw.startsWith("/admin")) return null;
  return raw;
}
