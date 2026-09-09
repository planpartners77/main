import Link from "next/link";
import { PHONE_STOCK_STATUS_LABELS } from "@/lib/mobile/device-spec";
import { storageLabel } from "@/lib/mobile/device-spec";
import { bestEffectivePrice, type PhoneDeviceListItem } from "@/lib/mobile/filters";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function PhoneDeviceCard({ item }: { item: PhoneDeviceListItem }) {
  const price = bestEffectivePrice(item);
  const soldOut = item.extra.stock_status === "sold_out";
  const hasIncentive = (item.incentive_min ?? item.incentive_max ?? item.incentive_exact ?? 0) > 0;

  return (
    <Link
      href={`/mobile/${item.id}`}
      className={`block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/30 hover:shadow-md ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
          {item.extra.manufacturer}
        </span>
        {item.extra.stock_status !== "in_stock" && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              soldOut ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"
            }`}
          >
            {PHONE_STOCK_STATUS_LABELS[item.extra.stock_status]}
          </span>
        )}
      </div>

      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션
        <img src={item.image_url} alt={item.title} className="mt-3 h-32 w-full rounded-xl object-cover" />
      ) : (
        <div className="mt-3 flex h-32 w-full items-center justify-center rounded-xl bg-gray-50 text-xs text-gray-300">
          이미지 준비중
        </div>
      )}

      <p className="mt-3 text-sm font-bold text-[var(--brand-navy)]">{item.title}</p>
      <p className="mt-0.5 text-xs text-gray-500">
        {storageLabel(item.extra.storage_gb)}
        {item.extra.color && ` · ${item.extra.color}`}
      </p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <p className="text-lg font-bold text-[var(--brand-navy)]">{formatWon(price)}</p>
        {hasIncentive && item.extra.release_price != null && item.extra.release_price > price && (
          <p className="text-xs text-gray-400 line-through">{formatWon(item.extra.release_price)}</p>
        )}
      </div>

      {item.partner_name && <p className="mt-1 text-[11px] text-gray-400">{item.partner_name}</p>}
    </Link>
  );
}
