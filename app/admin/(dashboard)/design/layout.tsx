import { DesignTabs } from "@/components/admin/design/DesignTabs";

export default function AdminDesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--brand-navy)]">디자인관리</h1>
      <p className="mt-1 text-sm text-gray-500">배너·팝업·페이지·이미지 등 사이트 화면 요소를 관리합니다.</p>
      <div className="mt-4">
        <DesignTabs />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
