import { createClient } from "@/lib/supabase/server";
import { isSectionType, type SectionType } from "@/lib/design/page-sections";

export interface PageRow {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface PageSectionRow {
  id: number;
  page_id: string;
  type: SectionType;
  sort_order: number;
  is_active: boolean;
  config: Record<string, unknown>;
}

interface RawPageSectionRow {
  id: number;
  page_id: string;
  type: string;
  sort_order: number;
  is_active: boolean;
  config: Record<string, unknown>;
}

function normalizeSections(rows: RawPageSectionRow[] | null): PageSectionRow[] {
  return (rows ?? []).filter((row): row is RawPageSectionRow & { type: SectionType } => isSectionType(row.type));
}

// 공개 화면(app/(site))에서 쓰는 조회 — status='published'인 페이지 + is_active=true인 섹션만
// RLS(page_sections_select_public)가 통과시키므로, 여기서 다시 필터링할 필요는 없다.
export async function getPublishedPageWithSections(
  slug: string,
): Promise<{ page: PageRow; sections: PageSectionRow[] } | null> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, title, template, status, created_at, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!page) return null;

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, page_id, type, sort_order, is_active, config")
    .eq("page_id", page.id)
    .eq("is_active", true)
    .order("sort_order");

  return { page: page as PageRow, sections: normalizeSections(sections) };
}

// 관리자 화면용 — draft 포함 전체 상태, is_active=false인 섹션도 함께 보여줘야 편집할 수 있다.
// RLS(pages_select_admin_all/page_sections_select_admin_all)가 관리자 세션에는 전체를 허용한다.
export async function getPageWithAllSections(
  id: string,
): Promise<{ page: PageRow; sections: PageSectionRow[] } | null> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, title, template, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!page) return null;

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, page_id, type, sort_order, is_active, config")
    .eq("page_id", id)
    .order("sort_order");

  return { page: page as PageRow, sections: normalizeSections(sections) };
}

export async function listPages(): Promise<PageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("id, slug, title, template, status, created_at, updated_at")
    .order("updated_at", { ascending: false });
  return (data ?? []) as PageRow[];
}
