export interface ApplyClickRow {
  id: string;
  created_at: string;
  target_url: string | null;
  categories: { name: string; slug: string } | null;
  products: { title: string } | null;
  profiles: { display_name: string | null; phone: string | null } | null;
}

export const APPLY_CLICKS_PAGE_SIZE = 50;
