const STORAGE_KEY = "pp_ref";
const COOKIE_KEY = "pp_ref_code";
const TTL_DAYS = 30;

export interface StoredReferral {
  codeId: string;
  code: string;
}

// Safari ITP 등으로 localStorage가 지워지거나 접근 불가한 경우를 대비해 쿠키에도 코드를
// 함께 저장한다(Bizmobile ReferralTracker.tsx와 동일한 이중 저장 방식).
function setCookie(name: string, value: string, days: number) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function recordReferralClick(code: string) {
  fetch("/api/referral", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "click", code }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { codeId?: string } | null) => {
      if (!data?.codeId) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ codeId: data.codeId, code, savedAt: Date.now() }));
      } catch {}
      setCookie(COOKIE_KEY, code, TTL_DAYS);
    })
    .catch(() => {});
}

export function getStoredReferral(): StoredReferral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReferral & { savedAt: number };
    if (Date.now() - parsed.savedAt > TTL_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { codeId: parsed.codeId, code: parsed.code };
  } catch {
    return null;
  }
}

// 회원가입 시 사용할 추천코드 문자열. localStorage(codeId까지 확인된 값)를 우선하고,
// 없으면 쿠키(코드 문자열만 있음 — handle_new_user가 가입 시점에 다시 유효성 검증한다)로 폴백한다.
export function getReferralCodeForSignup(): string | null {
  const stored = getStoredReferral();
  if (stored?.code) return stored.code;
  return getCookie(COOKIE_KEY);
}
