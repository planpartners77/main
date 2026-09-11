import { LeadStatusSelect } from "@/components/admin/leads/LeadStatusSelect";
import { LeadMemoField } from "@/components/admin/leads/LeadMemoField";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { summarizeContact, type LeadRow } from "@/lib/admin/leads";

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  canceled: "bg-gray-100 text-gray-500",
};

// "전체" 탭(카테고리 열 표시)과 카테고리별 탭(카테고리가 이미 문맥으로 드러나 열 생략)이
// 공유하는 목록 렌더링. 신청내역 하위메뉴 도입 전에는 leads/page.tsx 하나에만 있던 마크업이다.
export function LeadsTable({ leads, showCategoryColumn }: { leads: LeadRow[]; showCategoryColumn: boolean }) {
  if (leads.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        접수된 신청이 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
            <th className="px-4 py-3">접수일시</th>
            {showCategoryColumn && <th className="px-4 py-3">카테고리</th>}
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">연락처</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">메모</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const { name, phone } = summarizeContact(lead.guest_contact);
            return (
              <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {new Date(lead.created_at).toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                {showCategoryColumn && (
                  <td className="whitespace-nowrap px-4 py-3">{lead.categories?.name ?? "-"}</td>
                )}
                <td className="whitespace-nowrap px-4 py-3 font-medium">{name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{phone}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {LEAD_STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                    </span>
                    <LeadStatusSelect leadId={lead.id} status={lead.status} referralCodeId={lead.referral_code_id} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LeadMemoField leadId={lead.id} memo={lead.admin_memo} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
