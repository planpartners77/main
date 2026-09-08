"use client";

import { useState } from "react";
import { PROMOTION_TYPE_SHORT_LABELS, type PromotionType } from "@/lib/usim/plan-spec";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function promotionSentence(type: PromotionType, basePrice: number, effectivePrice: number): string {
  const diff = formatWon(basePrice - effectivePrice);
  if (type === "discount") {
    return `정가 ${formatWon(basePrice)}에서 ${diff} 추가할인 받아 월 ${formatWon(effectivePrice)}만 내요`;
  }
  return `월 ${formatWon(basePrice)} 내고 ${diff} ${PROMOTION_TYPE_SHORT_LABELS[type]} 받아요`;
}

export function UsimPlanPriceCard({
  basePrice,
  effectivePrice,
  promotionLabel,
  promotionType,
  schedule,
  durationMonths,
  lifetime,
}: {
  basePrice: number;
  effectivePrice: number;
  promotionLabel: string;
  promotionType: PromotionType;
  schedule: { month: number; amount: number }[];
  durationMonths: number;
  lifetime: boolean;
}) {
  const [showEffective, setShowEffective] = useState(true);
  const shortLabel = PROMOTION_TYPE_SHORT_LABELS[promotionType];

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-end">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          {shortLabel} 포함가로 보기
          <button
            type="button"
            role="switch"
            aria-checked={showEffective}
            onClick={() => setShowEffective((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              showEffective ? "bg-[var(--brand-blue)]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                showEffective ? "left-4" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {showEffective ? (
        <>
          <div className="mt-2 flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-400">정가</p>
              <p className="text-lg font-semibold text-gray-400 line-through">{formatWon(basePrice)}</p>
            </div>
            <span className="text-gray-300">→</span>
            <div>
              <p className="text-xs text-[var(--brand-blue)]">{shortLabel} 포함하면</p>
              <p className="text-2xl font-bold text-[var(--brand-blue)]">{formatWon(effectivePrice)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {promotionSentence(promotionType, basePrice, effectivePrice)}
            {!lifetime && durationMonths !== Infinity ? ` (최대 ${durationMonths}개월)` : lifetime ? " (평생 적용)" : ""}
          </p>
          {schedule.length > 0 && (
            <details className="mt-3 text-xs text-gray-500">
              <summary className="cursor-pointer font-semibold text-[var(--brand-navy)]">
                {promotionLabel} · {promotionType === "discount" ? "할인" : "지급"} 스케줄 자세히
              </summary>
              <ul className="mt-2 space-y-1">
                {schedule.map((s, i) => (
                  <li key={i}>
                    {s.month === 0 ? "매월(평생)" : `${s.month}개월차`} · {formatWon(s.amount)} {shortLabel}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      ) : (
        <div className="mt-2">
          <p className="text-2xl font-bold text-[var(--brand-navy)]">
            {formatWon(basePrice)}
            <span className="ml-1 text-sm font-medium text-gray-400">/월</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">{shortLabel} 미포함 정가예요</p>
        </div>
      )}
    </div>
  );
}
