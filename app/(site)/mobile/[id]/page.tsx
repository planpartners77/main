import Link from "next/link";
import { notFound } from "next/navigation";
import { getMobilePlanDetail } from "@/lib/mobile/plans-query";
import { callLabel, dataLabel, smsLabel } from "@/lib/mobile/plan-spec";
import { effectiveMonthlyPrice, isLifetimePromotion, promotionDurationMonths } from "@/lib/mobile/filters";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export default async function MobilePlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMobilePlanDetail(id);
  if (!item) notFound();

  const price = effectiveMonthlyPrice(item);
  const hasPromo = !!item.promotion;
  const durationMonths = promotionDurationMonths(item.promotion);
  const lifetime = isLifetimePromotion(item.promotion);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-10">
      <Link href="/mobile" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 요금제 목록
      </Link>

      <p className="mt-4 text-xs font-semibold text-gray-500">{item.partner_name ?? "통신사 미지정"}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">{item.title}</h1>
      <p className="mt-1 text-lg font-semibold text-gray-600">
        월 {dataLabel(item.extra.data_gb)}
        {item.extra.data_throttle_speed !== "none" && " + 소진 후 속도 제한"}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-gray-500">
        <span className="rounded-full bg-gray-50 px-2.5 py-1">{callLabel(item.extra.call_minutes)}</span>
        <span className="rounded-full bg-gray-50 px-2.5 py-1">{smsLabel(item.extra.sms_count)}</span>
        <span className="rounded-full bg-gray-50 px-2.5 py-1">{item.extra.carrier_network}망</span>
        <span className="rounded-full bg-gray-50 px-2.5 py-1">{item.extra.network_tech}</span>
        <span className="rounded-full bg-gray-50 px-2.5 py-1">
          {item.extra.contract_months > 0 ? `${item.extra.contract_months}개월 약정` : "무약정"}
        </span>
      </div>

      {/* 가격 비교 블록 */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        {hasPromo && item.base_price != null ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-400">정가</p>
                <p className="text-lg font-semibold text-gray-400 line-through">{formatWon(item.base_price)}</p>
              </div>
              <span className="text-gray-300">→</span>
              <div>
                <p className="text-xs text-[var(--brand-blue)]">페이백 포함하면</p>
                <p className="text-2xl font-bold text-[var(--brand-blue)]">{formatWon(price)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              월 {formatWon(item.base_price)} 내고 {formatWon(item.base_price - price)} 돌려받아요
              {!lifetime && durationMonths !== Infinity ? ` (최대 ${durationMonths}개월)` : lifetime ? " (평생 적용)" : ""}
            </p>
            {item.promotion!.schedule.length > 0 && (
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer font-semibold text-[var(--brand-navy)]">
                  {item.promotion!.label} · 지급 스케줄 자세히
                </summary>
                <ul className="mt-2 space-y-1">
                  {item.promotion!.schedule.map((s, i) => (
                    <li key={i}>
                      {s.month === 0 ? "매월(평생)" : `${s.month}개월차`} · {formatWon(s.amount)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className="text-2xl font-bold text-[var(--brand-navy)]">{formatWon(price)}<span className="ml-1 text-sm font-medium text-gray-400">/월</span></p>
        )}
      </div>

      {/* 기본정보 테이블 */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-[var(--brand-navy)]">기본정보</h2>
        <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white text-sm">
          {[
            ["데이터", dataLabel(item.extra.data_gb)],
            ["소진 후 속도", item.extra.data_throttle_speed === "none" ? "제한 없음" : item.extra.data_throttle_speed],
            ["통화", callLabel(item.extra.call_minutes)],
            ["문자", smsLabel(item.extra.sms_count)],
            ["약정", item.extra.contract_months > 0 ? `${item.extra.contract_months}개월` : "무약정"],
            ["유심 타입", item.extra.sim_type === "usim" ? "유심" : item.extra.sim_type === "esim" ? "eSIM" : "유심 / eSIM"],
            ["인터넷 결합", item.extra.internet_bundle ? "가능" : "불가"],
            ["핫스팟", item.extra.hotspot_gb != null ? `${item.extra.hotspot_gb}GB` : "미제공"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {item.extra.features.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--brand-navy)]">지원서비스</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.extra.features.map((f) => (
              <span key={f} className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {(item.extra.eligibility_minor || item.extra.eligibility_foreigner || item.extra.tags.length > 0) && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--brand-navy)]">가입 안내</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            {item.extra.tags.map((t) => (
              <span key={t} className="rounded-full bg-[var(--surface-tint)] px-3 py-1.5 text-[var(--brand-blue-dark)]">
                {t} 전용
              </span>
            ))}
            {item.extra.eligibility_minor && <span className="rounded-full bg-gray-50 px-3 py-1.5">미성년자 가입 가능</span>}
            {item.extra.eligibility_foreigner && <span className="rounded-full bg-gray-50 px-3 py-1.5">외국인 가입 가능</span>}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white p-4 sm:static sm:mt-10 sm:border-0 sm:p-0">
        <Link
          href={`/apply/mobile?planId=${item.id}`}
          className="block w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-center text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-[var(--brand-blue-dark)]"
        >
          신청하기
        </Link>
      </div>
    </main>
  );
}
