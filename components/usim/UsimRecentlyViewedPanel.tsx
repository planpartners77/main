"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentlyViewed, type RecentlyViewedPlan } from "@/lib/usim/recently-viewed";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function UsimRecentlyViewedPanel() {
  const [plans, setPlans] = useState<RecentlyViewedPlan[]>([]);

  useEffect(() => {
    // localStorage는 서버에서 읽을 수 없으므로 마운트 후 한 번 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(getRecentlyViewed());
  }, []);

  if (plans.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold text-[var(--brand-navy)]">최근 본 요금제</p>
      <ul className="mt-3 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <Link href={`/usim/${plan.id}`} className="block group">
              <p className="truncate text-sm font-medium text-gray-700 group-hover:text-[var(--brand-blue)]">{plan.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {plan.partner_name ?? "통신사 미지정"} · {formatWon(plan.price)}/월
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
