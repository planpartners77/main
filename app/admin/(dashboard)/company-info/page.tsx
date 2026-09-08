import Link from "next/link";
import { getCompanyInfo } from "@/lib/design/site-settings";
import { CompanyInfoManager } from "@/components/admin/company/CompanyInfoManager";

export default async function AdminCompanyInfoPage() {
  const info = await getCompanyInfo();

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">회사 정보 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        푸터와 회사소개 페이지에 노출되는 상호·대표자·사업자등록번호 등 사업자 정보와 소개 문구를
        관리합니다. 저장하면 코드 배포 없이 즉시 사이트에 반영됩니다.
      </p>

      <div className="mt-4">
        <CompanyInfoManager info={info} />
      </div>
    </div>
  );
}
