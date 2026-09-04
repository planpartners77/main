"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface PointTransactionRow {
  id: number;
  amount: number;
  reason: string;
  created_at: string;
}

export function PointAdjustPanel({
  memberId,
  balance,
  transactions,
}: {
  memberId: string;
  balance: number;
  transactions: PointTransactionRow[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdjust(sign: 1 | -1) {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0 || !reason.trim()) {
      setError("금액(양수)과 사유를 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("fn_admin_adjust_points", {
      p_profile_id: memberId,
      p_amount: parsed * sign,
      p_reason: reason.trim(),
    });

    if (rpcError) {
      setSaving(false);
      setError(rpcError.message);
      return;
    }

    setSaving(false);
    setAmount("");
    setReason("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">포인트</p>
        <p className="text-lg font-bold text-[var(--brand-navy)]">{balance.toLocaleString()}P</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액"
          className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="사유"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={saving}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          지급
        </button>
        <button
          type="button"
          onClick={() => handleAdjust(-1)}
          disabled={saving}
          className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 disabled:opacity-40"
        >
          차감
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 max-h-48 overflow-y-auto border-t border-gray-100 pt-3">
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">포인트 내역이 없습니다.</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-gray-500">
                <span>
                  {new Date(t.created_at).toLocaleDateString("ko-KR")} · {t.reason}
                </span>
                <span className={t.amount >= 0 ? "font-semibold text-blue-600" : "font-semibold text-red-500"}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString()}P
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
