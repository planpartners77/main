import { createClient } from "@/lib/supabase/server";
import type { CategoryConfig, RegulationLevel, SubCategoryConfig, TrackType } from "@/lib/categories";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  track_type: TrackType;
  regulation_level: RegulationLevel;
  parent_id: string | null;
  sort_order: number;
  href: string | null;
  is_active: boolean;
}

export interface CategoryTreeRow extends CategoryRow {
  children: CategoryTreeRow[];
}

function buildTree(rows: CategoryRow[]): CategoryTreeRow[] {
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const row of rows) {
    const list = byParent.get(row.parent_id) ?? [];
    list.push(row);
    byParent.set(row.parent_id, list);
  }
  const attach = (parentId: string | null): CategoryTreeRow[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({ ...row, children: attach(row.id) }));
  return attach(null);
}

function toSubCategoryConfig(row: CategoryTreeRow): SubCategoryConfig {
  return {
    slug: row.slug,
    name: row.name,
    href: row.href ?? `/${row.slug}`,
    subcategories: row.children.length ? row.children.map(toSubCategoryConfig) : undefined,
  };
}

// 사이트 노출용(GlobalNav/CategoryQuickNav): is_active=true인 행만, 기존 정적
// lib/categories.ts와 동일한 CategoryConfig[] 모양으로 변환해 기존 렌더 컴포넌트를 그대로 쓴다.
export async function getCategoryTree(): Promise<CategoryConfig[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, track_type, regulation_level, parent_id, sort_order, href, is_active")
    .eq("is_active", true)
    .order("sort_order");
  const tree = buildTree((data ?? []) as CategoryRow[]);
  return tree.map((row) => ({
    slug: row.slug,
    name: row.name,
    trackType: row.track_type,
    regulationLevel: row.regulation_level,
    subcategories: row.children.length ? row.children.map(toSubCategoryConfig) : undefined,
  }));
}

// 관리자 카테고리관리 화면용: 숨김 카테고리도 포함한 전체 트리.
export async function getAllCategoriesTree(): Promise<CategoryTreeRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, track_type, regulation_level, parent_id, sort_order, href, is_active")
    .order("sort_order");
  return buildTree((data ?? []) as CategoryRow[]);
}

// 정적 폴더가 없는 새 카테고리/하위카테고리를 위한 catch-all 라우트용 조회.
// segments가 ["insurance"]면 최상위, ["travel","general"]이면 그 하위카테고리를 찾는다.
export async function getCategoryBySlugPath(segments: string[]): Promise<CategoryRow | null> {
  const supabase = await createClient();
  let parentId: string | null = null;
  let found: CategoryRow | null = null;
  for (const slug of segments) {
    const query = supabase
      .from("categories")
      .select("id, slug, name, track_type, regulation_level, parent_id, sort_order, href, is_active")
      .eq("slug", slug)
      .eq("is_active", true);
    const { data } = parentId === null ? await query.is("parent_id", null) : await query.eq("parent_id", parentId);
    const row = (data ?? [])[0] as CategoryRow | undefined;
    if (!row) return null;
    found = row;
    parentId = row.id;
  }
  return found;
}
