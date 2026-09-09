const STORAGE_KEY = "pp_ref";
const COOKIE_KEY = "pp_ref_code";
const UTM_STORAGE_KEY = "pp_utm";
const UTM_COOKIE_KEY = "pp_utm";
const TTL_DAYS = 30;

export interface StoredReferral {
  codeId: string;
  code: string;
}

export interface StoredUtm {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
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

// 추천 링크(?ref=)뿐 아니라 순수 광고/캠페인 링크(?utm_source=...)로 유입된 경우도
// leads에 채널을 남길 수 있도록, ref와 별개로 utm_* 파라미터를 캡처해 같은 방식(localStorage+쿠키,
// 30일 TTL)으로 저장한다. 이후 방문에서 utm 파라미터 없이 재방문하면 기존 값을 유지한다
// (recordReferralClick과 동일하게 새 utm 파라미터가 있을 때만 덮어쓰는 last-touch 정책).
export function captureUtmFromUrl(search: string) {
  const params = new URLSearchParams(search);
  const value: StoredUtm = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
  if (!value.utm_source && !value.utm_medium && !value.utm_campaign) return;

  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({ ...value, savedAt: Date.now() }));
  } catch {}
  setCookie(UTM_COOKIE_KEY, JSON.stringify(value), TTL_DAYS);
}

export function getStoredUtm(): StoredUtm | null {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUtm & { savedAt: number };
      if (Date.now() - parsed.savedAt <= TTL_DAYS * 24 * 60 * 60 * 1000) {
        return { utm_source: parsed.utm_source, utm_medium: parsed.utm_medium, utm_campaign: parsed.utm_campaign };
      }
      localStorage.removeItem(UTM_STORAGE_KEY);
    }
  } catch {}

  try {
    const cookieVal = getCookie(UTM_COOKIE_KEY);
    if (cookieVal) return JSON.parse(cookieVal) as StoredUtm;
  } catch {}
  return null;
}
