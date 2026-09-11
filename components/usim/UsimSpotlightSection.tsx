import Link from "next/link";
import { THROTTLE_SPEED_OPTIONS, callLabel, dataLabel, smsLabel, PROMOTION_TYPE_SHORT_LABELS } from "@/lib/usim/plan-spec";
import {
  effectiveMonthlyPrice,
  firstMonthPaybackAmount,
  isLifetimePromotion,
  promotionDurationMonths,
  type UsimPlanListItem,
} from "@/lib/usim/filters";
import { PartnerBadge } from "./PartnerBadge";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

const BULLET_TINTS = ["bg-[var(--brand-blue)]", "bg-emerald-500", "bg-amber-500"];

// 홈 화면용 압축 카드 — 프로모션(1건, payback) + 결합혜택 + 제휴혜택을 한데 모아
// 참고 이미지처럼 "혜택 여러 줄" 목록으로 보여준다. 브랜드 로고 아이콘은 별도 데이터가
// 없어 임의로 만들 수 없으므로, 줄마다 색만 다른 점(bullet)으로 구분한다.
function benefitLines(item: UsimPlanListItem): string[] {
  const lines: string[] = [];
  if (item.promotion) {
    const amount = firstMonthPaybackAmount(item.promotion);
    if (amount > 0) {
      const durationText = isLifetimePromotion(item.promotion) ? "평생" : `${promotionDurationMonths(item.promotion)}개월간`;
      lines.push(`${item.promotion.label} 매달 ${formatWon(amount)} ${PROMOTION_TYPE_SHORT_LABELS[item.promotion.type]} (${durationText})`);
    }
  }
  if (item.extra.bundle_benefit) lines.push(item.extra.bundle_benefit);
  for (const benefit of item.extra.partner_benefits) {
    if (lines.length >= 3) break;
    lines.push(benefit);
  }
  return lines.slice(0, 3);
}

function UsimSpotlightCard({ item }: { item: UsimPlanListItem }) {
  const price = effectiveMonthlyPrice(item);
  const throttle = THROTTLE_SPEED_OPTIONS.find((o) => o.value === item.extra.data_throttle_speed);
  const durationLabel = !item.promotion
    ? "정가"
    : isLifetimePromotion(item.promotion)
      ? "평생"
      : `${promotionDurationMonths(item.promotion)}개월간`;
  const benefits = benefitLines(item);

  return (
    <Link
      href={`/usim/${item.id}`}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-[var(--brand-blue)]/50 hover:shadow-sm"
    >
      <PartnerBadge name={item.partner_name} logoUrl={item.partner_logo_url} />

      <p className="mt-3 text-lg font-bold text-[var(--brand-navy)]">
        월 {dataLabel(item.extra.data_gb)}
        {throttle && item.extra.data_throttle_speed !== "none" && (
          <span className="ml-1 text-sm font-semibold text-gray-500">+ {throttle.label}</span>
        )}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {callLabel(item.extra.call_minutes)} | {smsLabel(item.extra.sms_count)}
      </p>

      {benefits.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
          {benefits.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] leading-snug text-gray-600">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${BULLET_TINTS[i % BULLET_TINTS.length]}`} />
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-start justify-between border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400">{durationLabel}</p>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--brand-blue)]">
            {formatWon(price)}
            <span className="ml-1 text-xs font-medium text-gray-400">/월</span>
          </p>
          {item.promotion && !isLifetimePromotion(item.promotion) && item.base_price != null && (
            <p className="mt-0.5 text-xs text-gray-400">
              {promotionDurationMonths(item.promotion)}개월 이후 정가 {formatWon(item.base_price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function UsimSpotlightSection({ title, items }: { title: string; items: UsimPlanListItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <UsimSpotlightCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/usim" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
            요금제 더보기 &gt;
          </Link>
        </div>
      </div>
    </section>
  );
}
