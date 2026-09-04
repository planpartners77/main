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
