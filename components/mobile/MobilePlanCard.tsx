import Link from "next/link";
import { callLabel, dataLabel, smsLabel } from "@/lib/mobile/plan-spec";
import { effectiveMonthlyPrice, promotionDurationMonths, type MobilePlanListItem } from "@/lib/mobile/filters";
import { PartnerBadge } from "./PartnerBadge";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function MobilePlanCard({ item }: { item: MobilePlanListItem }) {
  const price = effectiveMonthlyPrice(item);
  const hasPromo = !!item.promotion;
  const durationMonths = promotionDurationMonths(item.promotion);

  return (
    <Link
      href={`/mobile/${item.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-[var(--brand-blue)]/50 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <PartnerBadge name={item.partner_name} logoUrl={item.partner_logo_url} />
        {hasPromo && (
          <span className="rounded-full bg-[var(--surface-tint)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-blue-dark)]">
            페이백 포함
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-gray-500">{item.title}</p>
      <p className="mt-1 text-lg font-bold text-[var(--brand-navy)]">
        월 {dataLabel(item.extra.data_gb)}
        {item.extra.data_throttle_speed !== "none" && (
          <span className="ml-1 text-sm font-semibold text-gray-500">+ 소진 후 제한속도</span>
        )}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-500">
        <span className="rounded-full bg-gray-50 px-2 py-0.5">{callLabel(item.extra.call_minutes)}</span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5">{smsLabel(item.extra.sms_count)}</span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5">{item.extra.carrier_network}망</span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5">{item.extra.network_tech}</span>
        {item.extra.internet_bundle && item.extra.bundle_benefit && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[var(--brand-blue-dark)]">결합혜택</span>
        )}
        {item.extra.extra_costs.length > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">기타비용 있음</span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-[var(--brand-blue)]">
            {formatWon(price)}
            <span className="ml-1 text-xs font-medium text-gray-400">/월</span>
          </p>
          {hasPromo && item.base_price != null && price !== item.base_price && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              {durationMonths === Infinity ? "평생 적용" : `${durationMonths}개월 이후`} 정가 {formatWon(item.base_price)}
            </p>
          )}
        </div>
        {item.extra.selected_count > 0 && (
          <p className="text-[11px] font-semibold text-gray-400">{item.extra.selected_count.toLocaleString("ko-KR")}명이 선택</p>
        )}
      </div>
    </Link>
  );
}
