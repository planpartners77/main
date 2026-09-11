import Link from "next/link";
import { notFound } from "next/navigation";
import { getMobileDeviceDetail } from "@/lib/mobile/devices-query";
import { PHONE_STOCK_STATUS_LABELS, storageLabel } from "@/lib/mobile/device-spec";
import { bestEffectivePrice } from "@/lib/mobile/filters";
import { ApplyButton } from "@/components/shared/ApplyButton";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export default async function MobileDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMobileDeviceDetail(id);
  if (!item) notFound();

  const price = bestEffectivePrice(item);
  const soldOut = item.extra.stock_status === "sold_out";
  const hasIncentive = (item.incentive_min ?? item.incentive_max ?? item.incentive_exact ?? 0) > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-36 pt-10 sm:pb-10">
      <Link href="/mobile" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 기종 목록
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          {item.extra.manufacturer}
        </span>
        {item.partner_name && <span className="text-xs text-gray-400">{item.partner_name}</span>}
      </div>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">{item.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {storageLabel(item.extra.storage_gb)}
        {item.extra.color && ` · ${item.extra.color}`}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-gray-500">
        {item.extra.carriers.map((c) => (
          <span key={c} className="rounded-full bg-gray-50 px-2.5 py-1">
            {c}
          </span>
        ))}
        {item.extra.activation_types.map((a) => (
          <span key={a} className="rounded-full bg-gray-50 px-2.5 py-1">
            {a}
          </span>
        ))}
        {item.extra.self_provided_available && <span className="rounded-full bg-gray-50 px-2.5 py-1">자급제 가능</span>}
        {item.extra.esim_available && <span className="rounded-full bg-gray-50 px-2.5 py-1">eSIM 지원</span>}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        {item.extra.stock_status !== "in_stock" && (
          <p
            className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              soldOut ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"
            }`}
          >
            {PHONE_STOCK_STATUS_LABELS[item.extra.stock_status]}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-[var(--brand-navy)]">{formatWon(price)}</p>
          {hasIncentive && item.extra.release_price != null && item.extra.release_price > price && (
            <p className="text-sm text-gray-400 line-through">{formatWon(item.extra.release_price)}</p>
          )}
        </div>
        {hasIncentive && <p className="mt-1 text-xs text-gray-500">통신사·개통방식별 지원금이 반영된 예상 구매가입니다.</p>}
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-gray-100 bg-white p-4 sm:static sm:bottom-auto sm:z-auto sm:mt-10 sm:border-0 sm:p-0">
        {soldOut ? (
          <span className="block w-full rounded-full bg-gray-200 py-3.5 text-center text-sm font-semibold text-gray-500">
            품절된 기종입니다
          </span>
        ) : (
          <ApplyButton
            categorySlug="mobile"
            productId={item.id}
            applyUrl={item.apply_url}
            internalHref={`/apply/mobile?planId=${item.id}`}
            className="block w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-center text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-[var(--brand-blue-dark)]"
          />
        )}
      </div>
    </main>
  );
}
