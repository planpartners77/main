import { createClient } from "@/lib/supabase/server";
import { normalizeUsimPlanExtra, type PromotionType } from "./plan-spec";
import type { UsimPlanListItem, UsimPlanPromotion } from "./filters";

interface RawPromotion {
  id: string;
  label: string;
  type: PromotionType;
  total_amount: number;
  schedule: unknown;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface RawProduct {
  id: string;
  title: string;
  image_url: string | null;
  apply_url: string | null;
  base_price: number | null;
  extra: Record<string, unknown>;
  partner_id: string | null;
  partners: { name: string; logo_url: string | null } | null;
  plan_promotions: RawPromotion[] | null;
}

// 한 요금제에 활성 프로모션이 여러 개 등록된 경우(관리자 실수 등) 노출 순서가
// DB 조인 결과 순서에 좌우되지 않도록, 총 지급액이 큰 것을 우선하고 동률이면
// 가장 최근에 등록한 것을 택해 목록/상세 페이지가 항상 동일한 프로모션을 보여주게 한다.
function pickActivePromotion(promotions: RawPromotion[] | null): UsimPlanPromotion | null {
  if (!promotions || promotions.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const eligible = promotions.filter(
    (p) => p.is_active && (!p.valid_from || p.valid_from <= today) && (!p.valid_until || p.valid_until >= today),
  );
  if (eligible.length === 0) return null;
  const active = eligible.reduce((best, p) => {
    if (p.total_amount !== best.total_amount) return p.total_amount > best.total_amount ? p : best;
    return p.created_at > best.created_at ? p : best;
  });
  return {
    id: active.id,
    label: active.label,
    type: active.type,
    total_amount: active.total_amount,
    schedule: Array.isArray(active.schedule) ? (active.schedule as { month: number; amount: number }[]) : [],
    valid_from: active.valid_from,
    valid_until: active.valid_until,
  };
}

function toListItem(row: RawProduct, leadCount: number): UsimPlanListItem {
  const extra = normalizeUsimPlanExtra(row.extra);
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    apply_url: row.apply_url,
    base_price: row.base_price,
    extra: { ...extra, selected_count: leadCount },
    partner_id: row.partner_id,
    partner_name: row.partners?.name ?? null,
    partner_logo_url: row.partners?.logo_url ?? null,
    promotion: pickActivePromotion(row.plan_promotions),
  };
}

const SELECT_COLUMNS =
  "id, title, image_url, apply_url, base_price, extra, partner_id, partners(name, logo_url), plan_promotions(id, label, type, total_amount, schedule, valid_from, valid_until, is_active, created_at)";

// "n명 선택" 표시는 관리자 수동 입력이 아니라 실제 leads 건수를 집계한 값이어야 하므로,
// leads 테이블을 직접 읽을 수 없는 공개 페이지에서도 상품별 집계만 안전하게 가져온다.
async function getLeadCounts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Map<string, number>> {
  const { data } = await supabase.rpc("usim_plan_lead_counts");
  const map = new Map<string, number>();
  for (const row of (data ?? []) as { product_id: string; lead_count: number }[]) {
    map.set(row.product_id, row.lead_count);
  }
  return map;
}

export async function getUsimPlanList(): Promise<UsimPlanListItem[]> {
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "usim").maybeSingle();
  if (!category) return [];

  const [{ data }, leadCounts] = await Promise.all([
    supabase
      .from("products")
      .select(SELECT_COLUMNS)
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    getLeadCounts(supabase),
  ]);

  return ((data ?? []) as unknown as RawProduct[]).map((row) => toListItem(row, leadCounts.get(row.id) ?? 0));
}

export async function getUsimPlanDetail(id: string): Promise<UsimPlanListItem | null> {
  const supabase = await createClient();
  const [{ data }, leadCounts] = await Promise.all([
    supabase.from("products").select(SELECT_COLUMNS).eq("id", id).eq("is_active", true).maybeSingle(),
    getLeadCounts(supabase),
  ]);
  if (!data) return null;
  const row = data as unknown as RawProduct;
  return toListItem(row, leadCounts.get(row.id) ?? 0);
}
