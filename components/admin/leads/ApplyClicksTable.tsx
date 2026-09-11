import type { ApplyClickRow } from "@/lib/admin/apply-clicks";

// "신청하기" 클릭 이력(apply_clicks) 전용 목록. leads(정식 접수)와 달리 상태값/메모 워크플로가
// 없어 LeadsTable과는 별도 컴포넌트로 둔다 — 회원이면 profiles 조인 값을, 비회원이면 공란과
// "비회원" 배지만 보여준다.
export function ApplyClicksTable({ clicks, showCategoryColumn }: { clicks: ApplyClickRow[]; showCategoryColumn: boolean }) {
  if (clicks.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        신청하기 클릭 이력이 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
            <th className="px-4 py-3">클릭일시</th>
            {showCategoryColumn && <th className="px-4 py-3">카테고리</th>}
            <th className="px-4 py-3">상품</th>
            <th className="px-4 py-3">구분</th>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">연락처</th>
          </tr>
        </thead>
        <tbody>
          {clicks.map((click) => {
            const isMember = !!click.profiles;
            return (
              <tr key={click.id} className="border-b border-gray-50 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {new Date(click.created_at).toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                {showCategoryColumn && (
                  <td className="whitespace-nowrap px-4 py-3">{click.categories?.name ?? "-"}</td>
                )}
                <td className="whitespace-nowrap px-4 py-3">{click.products?.title ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isMember ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isMember ? "회원" : "비회원"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{click.profiles?.display_name ?? ""}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{click.profiles?.phone ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
