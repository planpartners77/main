import Link from "next/link";
import { notFound } from "next/navigation";
import { getMobilePlanDetail } from "@/lib/mobile/plans-query";
import { callLabel, dataLabel, smsLabel } from "@/lib/mobile/plan-spec";
import { effectiveMonthlyPrice, isLifetimePromotion, promotionDurationMonths } from "@/lib/mobile/filters";
import { MobilePlanPriceCard } from "@/components/mobile/MobilePlanPriceCard";
import { MobilePlanInfoTabs } from "@/components/mobile/MobilePlanInfoTabs";
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

      <MobilePlanInfoTabs extra={item.extra} />

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
