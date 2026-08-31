"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface SettlementRow {
  id: string;
  partner_id: string;
  lead_id: string | null;
  amount: number;
  status: "draft" | "approved" | "paid" | "rejected";
  memo: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  partners: { name: string } | null;
}

interface PartnerOption {
  id: string;
  name: string;
}

export interface LeadOption {
  id: string;
  guest_contact: Record<string, unknown> | null;
  categories: { name: string } | null;
  products: { title: string; partner_id: string | null; incentive_exact: number | null } | null;
}

const EMPTY_FORM = {
  partner_id: "",
  lead_id: "",
  amount: "",
  memo: "",
};

const STATUS_LABEL: Record<string, string> = { draft: "등록", approved: "승인", paid: "지급완료", rejected: "반려" };
const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

function leadLabel(lead: LeadOption) {
  const contact = lead.guest_contact ?? {};
  const name = (contact.name as string) ?? (contact.guardianName as string) ?? "이름없음";
  const category = lead.categories?.name ?? "-";
  const product = lead.products?.title ?? "";
  return `[${category}] ${name}${product ? ` · ${product}` : ""}`;
}

export function SettlementManager({
  settlements,
  partners,
  leads,
}: {
  settlements: SettlementRow[];
  partners: PartnerOption[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedLeadIds = new Set(settlements.map((s) => s.lead_id).filter(Boolean));
  const availableLeads = leads.filter((l) => !linkedLeadIds.has(l.id));

  function startCreate() {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function handleLeadSelect(leadId: string) {
    const lead = availableLeads.find((l) => l.id === leadId);
    setForm({
      ...form,
      lead_id: leadId,
      partner_id: lead?.products?.partner_id ?? form.partner_id,
      amount: lead?.products?.incentive_exact != null ? String(lead.products.incentive_exact) : form.amount,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.partner_id || !form.amount) {
      setError("파트너와 금액은 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("settlements").insert({
      partner_id: form.partner_id,
      lead_id: form.lead_id || null,
      amount: Number(form.amount),
      memo: form.memo.trim() || null,
      status: "draft",
    });

    setSaving(false);
    if (insertError) {
      setError(`저장 실패: ${insertError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function updateStatus(row: SettlementRow, patch: Record<string, unknown>) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("settlements").update(patch).eq("id", row.id);
    if (updateError) {
      alert(`처리 실패: ${updateError.message}`);
      return;
    }
    router.refresh();
  }

  async function handleDelete(row: SettlementRow) {
    if (!confirm("이 정산 등록건을 삭제할까요?")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("settlements").delete().eq("id", row.id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          등록(draft) → 승인(approved) → 지급완료(paid) 순서로만 진행됩니다. 중복 지급 방지를 위해 단계를
          건너뛸 수 없습니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 정산 등록"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm sm:col-span-2">
            연결 리드 (선택 — 완료 처리된 신청 건에 대한 인센티브 정산 시)
            <select
              value={form.lead_id}
              onChange={(e) => handleLeadSelect(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">없음(수동 정산)</option>
              {availableLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {leadLabel(lead)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            파트너
            <select
              value={form.partner_id}
              onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            금액
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            메모 (선택)
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : "등록"}
            </button>
          </div>
        </form>
      )}

      {settlements.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 정산 건이 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">등록일</th>
                <th className="px-4 py-3">파트너</th>
                <th className="px-4 py-3">금액</th>
                <th className="px-4 py-3">메모</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {settlements.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(row.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.partners?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{row.amount.toLocaleString("ko-KR")}원</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">{row.memo ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      {row.status === "draft" && (
                        <>
                          <button
                            onClick={() => updateStatus(row, { status: "approved", approved_at: new Date().toISOString() })}
                            className="text-gray-500 hover:text-[var(--brand-navy)]"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => updateStatus(row, { status: "rejected" })}
                            className="text-red-500 hover:text-red-700"
                          >
                            반려
                          </button>
                          <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
                            삭제
                          </button>
                        </>
                      )}
                      {row.status === "approved" && (
                        <button
                          onClick={() => updateStatus(row, { status: "paid", paid_at: new Date().toISOString() })}
                          className="text-gray-500 hover:text-[var(--brand-navy)]"
                        >
                          지급완료
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
