import Link from "next/link";
import { CODE_MANAGED_PAGE_GROUPS } from "@/lib/design/code-managed-pages";

// 위 PageListManager(섹션 조립형 pages 테이블)와 달리 이 목록은 읽기 전용 안내다.
// 실제 데이터는 각 전용 관리 화면에 있으므로 여기서 새로 만들거나 지울 수 있는 항목이 아니다.
export function CodeManagedPageList() {
  return (
    <div className="mt-10">
      <p className="text-sm font-semibold text-gray-700">그 외 사이트 페이지</p>
      <p className="mt-1 text-sm text-gray-500">
        위 목록은 섹션을 직접 조립하는 페이지만 관리합니다. 아래 페이지들은 코드에 고정된 화면이며, 각자의 전용 관리
        화면에서 내용을 수정하면 됩니다.
      </p>

      <div className="mt-4 space-y-6">
        {CODE_MANAGED_PAGE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-400">{group.label}</p>
            <p className="mt-0.5 text-xs text-gray-400">{group.description}</p>
            <div className="mt-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                    <th className="px-4 py-3">페이지</th>
                    <th className="px-4 py-3">주소</th>
                    <th className="px-4 py-3">관리 위치</th>
                  </tr>
                </thead>
                <tbody>
                  {group.pages.map((page) => (
                    <tr key={page.path} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium">{page.title}</td>
                      <td className="px-4 py-3 text-gray-500">{page.path}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {page.managedHref ? (
                          <Link href={page.managedHref} className="hover:text-[var(--brand-navy)] hover:underline">
                            {page.managedAt}
                          </Link>
                        ) : (
                          page.managedAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
