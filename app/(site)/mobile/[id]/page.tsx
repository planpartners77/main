import Link from "next/link";
import { notFound } from "next/navigation";
import { getMobilePlanDetail } from "@/lib/mobile/plans-query";
import { callLabel, dataLabel, smsLabel } from "@/lib/mobile/plan-spec";
import { effectiveMonthlyPrice, isLifetimePromotion, promotionDurationMonths } from "@/lib/mobile/filters";
import { MobilePlanPriceCard } from "@/components/mobile/MobilePlanPriceCard";
import { RecordRecentView } from "@/components/mobile/RecordRecentView";

const ACTIVATION_STEPS = [
  { title: "1. 온라인 신청", desc: "신청하기 버튼을 눌러 본인 확인 정보와 원하는 개통일을 입력해요." },
  { title: "2. 상담 연락", desc: "담당 상담사가 영업일 기준 1일 이내 신청 내용을 확인하는 연락을 드려요." },
  { title: "3. 서류 및 본인인증", desc: "신분증 확인, 유심/eSIM 수령 등 개통에 필요한 절차를 안내받아요." },
  { title: "4. 개통 접수", desc: "확인이 끝나면 통신사에 개통을 접수하고 진행 상황을 안내해 드려요." },
  { title: "5. 개통 완료", desc: "개통이 완료되면 문자로 안내드리고, 이후 요금제 이용이 시작돼요." },
];

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
      <RecordRecentView plan={{ id: item.id, title: item.title, partner_name: item.partner_name, price }} />

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
      {hasPromo && item.base_price != null ? (
        <MobilePlanPriceCard
          basePrice={item.base_price}
          effectivePrice={price}
          promotionLabel={item.promotion!.label}
          schedule={item.promotion!.schedule}
          durationMonths={durationMonths}
          lifetime={lifetime}
        />
      ) : (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-2xl font-bold text-[var(--brand-navy)]">
            {formatWon(price)}
            <span className="ml-1 text-sm font-medium text-gray-400">/월</span>
          </p>
        </div>
      )}

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

      {item.extra.internet_bundle && item.extra.bundle_benefit && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--brand-navy)]">결합 혜택</h2>
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            {item.extra.bundle_benefit}
          </div>
        </div>
      )}

      {item.extra.extra_costs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--brand-navy)]">기타비용</h2>
          <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white text-sm">
            {item.extra.extra_costs.map((cost, i) => (
              <div key={i} className="flex justify-between px-4 py-3">
                <dt className="text-gray-500">{cost.label}</dt>
                <dd className="font-medium text-gray-800">{cost.amount === 0 ? "무료" : formatWon(cost.amount)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

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

      <div className="mt-6">
        <h2 className="text-sm font-bold text-[var(--brand-navy)]">신청 및 개통 과정</h2>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white text-sm">
          {ACTIVATION_STEPS.map((step) => (
            <div key={step.title} className="px-4 py-3">
              <p className="font-semibold text-gray-800">{step.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

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
