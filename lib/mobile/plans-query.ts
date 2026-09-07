import { createClient } from "@/lib/supabase/server";
import { normalizeMobilePlanExtra } from "./plan-spec";
import type { MobilePlanListItem, MobilePlanPromotion } from "./filters";

interface RawPromotion {
  id: string;
  label: string;
  type: "fixed" | "point";
  total_amount: number;
  schedule: unknown;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

interface RawProduct {
  id: string;
  title: string;
  image_url: string | null;
  base_price: number | null;
  extra: Record<string, unknown>;
  partner_id: string | null;
  partners: { name: string } | null;
  plan_promotions: RawPromotion[] | null;
}

function pickActivePromotion(promotions: RawPromotion[] | null): MobilePlanPromotion | null {
  if (!promotions || promotions.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const active = promotions.find(
    (p) => p.is_active && (!p.valid_from || p.valid_from <= today) && (!p.valid_until || p.valid_until >= today),
  );
  if (!active) return null;
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

function toListItem(row: RawProduct): MobilePlanListItem {
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    base_price: row.base_price,
    extra: normalizeMobilePlanExtra(row.extra),
    partner_id: row.partner_id,
    partner_name: row.partners?.name ?? null,
    promotion: pickActivePromotion(row.plan_promotions),
  };
}

const SELECT_COLUMNS =
  "id, title, image_url, base_price, extra, partner_id, partners(name), plan_promotions(id, label, type, total_amount, schedule, valid_from, valid_until, is_active)";

export async function getMobilePlanList(): Promise<MobilePlanListItem[]> {
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "mobile").maybeSingle();
  if (!category) return [];

  const { data } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as RawProduct[]).map(toListItem);
}

export async function getMobilePlanDetail(id: string): Promise<MobilePlanListItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  return toListItem(data as unknown as RawProduct);
}
