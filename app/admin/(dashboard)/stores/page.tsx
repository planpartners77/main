import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoreManager, type StoreRow, type CategoryOption } from "@/components/admin/stores/StoreManager";

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const [{ data: stores }, { data: categories }] = await Promise.all([
    supabase.from("stores").select("id, region, address, lat, lng, supported_categories").order("region"),
    supabase.from("categories").select("slug, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">매장 관리</h1>
      <p className="mt-1 text-sm text-gray-500">오프라인 지점 CRUD 및 지역별 취급 카테고리 설정입니다.</p>
      <div className="mt-6">
        <StoreManager
          stores={(stores ?? []) as StoreRow[]}
          categories={(categories ?? []) as CategoryOption[]}
        />
      </div>
    </div>
  );
}
