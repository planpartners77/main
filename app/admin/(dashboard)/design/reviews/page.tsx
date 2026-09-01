import { createClient } from "@/lib/supabase/server";
import { ReviewManager, type ReviewRow } from "@/components/admin/design/ReviewManager";

export default async function DesignReviewsPage() {
  const supabase = await createClient();
  const [{ data: reviews }, { data: categories }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, category_id, author_label, rating, body, is_active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").is("parent_id", null).order("sort_order"),
  ]);

  return <ReviewManager reviews={(reviews ?? []) as ReviewRow[]} categories={categories ?? []} />;
}
