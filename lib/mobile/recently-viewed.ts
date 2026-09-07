// 최근 본 요금제 — 서버에 남기지 않고 방문자 브라우저의 localStorage에만 저장한다.
// 목록 페이지 새로고침/뒤로가기 시에도 유지되어야 하므로 세션이 아닌 localStorage를 사용.

const STORAGE_KEY = "pp_mobile_recently_viewed";
const MAX_ITEMS = 5;

export interface RecentlyViewedPlan {
  id: string;
  title: string;
  partner_name: string | null;
  price: number;
  viewed_at: string;
}

export function getRecentlyViewed(): RecentlyViewedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is RecentlyViewedPlan => !!p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(plan: Omit<RecentlyViewedPlan, "viewed_at">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewed().filter((p) => p.id !== plan.id);
    const next = [{ ...plan, viewed_at: new Date().toISOString() }, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage 접근 불가(사생활 보호 모드 등) 시 조용히 무시
  }
}
