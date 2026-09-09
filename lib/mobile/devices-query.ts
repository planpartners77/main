import { createClient } from "@/lib/supabase/server";
import { normalizePhoneDeviceExtra } from "./device-spec";
import type { PhoneDeviceListItem } from "./filters";

interface RawProduct {
  id: string;
  title: string;
  image_url: string | null;
  apply_url: string | null;
  base_price: number | null;
  incentive_min: number | null;
  incentive_max: number | null;
  incentive_exact: number | null;
  extra: Record<string, unknown>;
  partner_id: string | null;
  partners: { name: string; logo_url: string | null } | null;
}

const SELECT_COLUMNS =
  "id, title, image_url, apply_url, base_price, incentive_min, incentive_max, incentive_exact, extra, partner_id, partners(name, logo_url)";

function toListItem(row: RawProduct): PhoneDeviceListItem {
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    apply_url: row.apply_url,
    base_price: row.base_price,
    incentive_min: row.incentive_min,
    incentive_max: row.incentive_max,
    incentive_exact: row.incentive_exact,
    extra: normalizePhoneDeviceExtra(row.extra),
    partner_id: row.partner_id,
    partner_name: row.partners?.name ?? null,
    partner_logo_url: row.partners?.logo_url ?? null,
  };
}

export async function getMobileDeviceList(): Promise<PhoneDeviceListItem[]> {
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

export async function getMobileDeviceDetail(id: string): Promise<PhoneDeviceListItem | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(SELECT_COLUMNS).eq("id", id).eq("is_active", true).maybeSingle();
  if (!data) return null;
  return toListItem(data as unknown as RawProduct);
}
