import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// "신청 내역" 하위메뉴를 카테고리별로 만들기 위한 노출 순서. 목록에 없는 카테고리(신규 추가분)는
// 뒤에 가나다순으로 붙는다 — categories 테이블에는 별도 sort_order 컬럼이 없다.
const CATEGORY_MENU_ORDER = ["travel", "internet", "usim", "mobile", "rental", "insurance", "funeral"];

function sortCategoriesForMenu<T extends { slug: string; name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const rankA = CATEGORY_MENU_ORDER.indexOf(a.slug);
    const rankB = CATEGORY_MENU_ORDER.indexOf(b.slug);
    const orderA = rankA === -1 ? CATEGORY_MENU_ORDER.length : rankA;
    const orderB = rankB === -1 ? CATEGORY_MENU_ORDER.length : rankB;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "ko");
  });
}

// /admin/login을 제외한 관리자 화면 전용 쉘. proxy.ts가 1차로 접근을 막고,
// 여기서 다시 한번 세션을 확인해 방어적으로 리다이렉트한다(방어 이중화).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <AdminSidebar
        role={session.role}
        displayName={session.displayName ?? session.email ?? "관리자"}
        leadCategories={sortCategoriesForMenu(categories ?? [])}
        managedCategories={session.managedCategories}
      />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
