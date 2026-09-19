// products-query.ts는 next/headers를 쓰는 서버 전용 supabase 클라이언트를 import하므로,
// 클라이언트 컴포넌트(ProductCard 등)에서 그대로 import하면 빌드가 깨진다.
// 타입/순수 함수만 이 파일로 분리해 클라이언트에서도 안전하게 쓸 수 있게 한다.

export interface DisplayProduct {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
  incentive_min: number | null;
  incentive_max: number | null;
  incentive_exact: number | null;
  category_id: string | null;
  category_slug: string | null;
}

// /mobile, /usim, /lp, /insurance처럼 products 테이블 행을 그대로 상세 페이지로 보여주는
// 카테고리만 여기 등록한다. 상조·여행·이벤트 등은 아직 개별 상세 페이지가 없어
// 상담/신청 플로우로만 연결되므로 제외.
const CATEGORY_SLUGS_WITH_DETAIL_PAGE = new Set(["mobile", "usim", "lp", "insurance"]);

export function productDetailHref(product: DisplayProduct): string | null {
  if (!product.category_slug || !CATEGORY_SLUGS_WITH_DETAIL_PAGE.has(product.category_slug)) return null;
  return `/${product.category_slug}/${product.id}`;
}

export interface DisplayCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ProductDisplayData {
  mode: "latest" | "manual";
  categories: DisplayCategory[];
  productsByCategory: Record<string, DisplayProduct[]>;
  manualProducts: DisplayProduct[];
}

export function formatWon(value: number | null): string {
  return value != null ? `${value.toLocaleString("ko-KR")}원` : "-";
}

// incentive_min/max는 비회원에게 범위로, incentive_exact는 로그인 회원에게만 노출한다
// (components/admin/products/ProductManager.tsx에 명시된 것과 동일한 규칙).
export function incentiveLabel(product: DisplayProduct, isLoggedIn: boolean): string | null {
  if (isLoggedIn && product.incentive_exact != null) {
    return `확정 지원금 ${formatWon(product.incentive_exact)}`;
  }
  if (product.incentive_min != null || product.incentive_max != null) {
    return `지원금 ${formatWon(product.incentive_min)} ~ ${formatWon(product.incentive_max)}`;
  }
  return null;
}
