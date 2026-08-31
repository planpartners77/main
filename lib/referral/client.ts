const STORAGE_KEY = "pp_ref";
const TTL_DAYS = 30;

export interface StoredReferral {
  codeId: string;
  code: string;
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
