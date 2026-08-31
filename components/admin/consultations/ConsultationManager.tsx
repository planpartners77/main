"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CategoryOption {
  id: string;
  name: string;
}

export interface UnassignedLead {
  id: string;
  guest_contact: Record<string, unknown> | null;
  created_at: string;
  categories: { id: string; name: string } | null;
}

export interface ConsultationRow {
  id: string;
  lead_id: string;
  status: string;
  preferred_time: string | null;
  call_log: string | null;
  withdrawal_notice_sent_at: string | null;
  created_at: string;
  leads: {
    guest_contact: Record<string, unknown> | null;
    categories: { name: string } | null;
  } | null;
}

export const CONSULTATION_STATUS_OPTIONS = [
  { value: "booked", label: "예약" },
  { value: "in_progress", label: "상담중" },
  { value: "completed", label: "상담완료" },
  { value: "canceled", label: "취소" },
] as const;

const STATUS_OPTIONS = CONSULTATION_STATUS_OPTIONS;

const STATUS_STYLE: Record<string, string> = {
  booked: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  canceled: "bg-gray-100 text-gray-500",
};

function contactName(contact: Record<string, unknown> | null) {
  if (!contact) return "-";
  return (contact.name as string) ?? "-";
}

function contactPhone(contact: Record<string, unknown> | null) {
  if (!contact) return "-";
  return (contact.phone as string) ?? "-";
}

const EMPTY_QUICK_FORM = {
  categoryId: "",
  name: "",
  phone: "",
  memo: "",
  consentObtained: false,
};

export function ConsultationManager({
  consultations,
  consultCategories,
  unassignedLeads = [],
}: {
  consultations: ConsultationRow[];
  consultCategories: CategoryOption[];
  unassignedLeads?: UnassignedLead[];
}) {
  const router = useRouter();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [logDrafts, setLogDrafts] = useState<Record<string, string>>({});
  const [convertError, setConvertError] = useState<string | null>(null);

  async function convertLead(leadId: string) {
    setConvertError(null);
    setSavingId(leadId);
    const supabase = createClient();
    const { error } = await supabase.from("consultations").insert({
      lead_id: leadId,
      status: "booked",
    });
    setSavingId(null);
    if (error) {
      setConvertError(`상담 전환 실패: ${error.message}`);
      return;
    }
    router.refresh();
  }

  async function handleQuickCreate() {
    setFormError(null);
    if (!quickForm.categoryId || !quickForm.name.trim() || !quickForm.phone.trim()) {
      setFormError("카테고리·이름·연락처는 필수입니다.");
      return;
    }
    if (!quickForm.consentObtained) {
      setFormError("전화 통화로 개인정보 수집·이용 동의를 받았는지 확인 후 체크해 주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        category_id: quickForm.categoryId,
        user_id: null,
        status: "received",
        guest_contact: {
          name: quickForm.name.trim(),
          phone: quickForm.phone.trim(),
          memo: quickForm.memo.trim() || null,
          channel: "phone",
        },
        consent: {
          phoneVerbal: true,
          obtainedAt: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      setFormError(`리드 생성 실패: ${leadError?.message ?? "알 수 없는 오류"}`);
      setSubmitting(false);
      return;
    }

    const { error: consultError } = await supabase.from("consultations").insert({
      lead_id: lead.id,
      status: "booked",
    });

    if (consultError) {
      // 상담 생성이 실패하면(예: 담당 카테고리가 아닌 경우) 방금 만든 리드가 고아로 남으므로 되돌린다.
      await supabase.from("leads").delete().eq("id", lead.id);
      setFormError(`상담 생성 실패: ${consultError.message}`);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setQuickForm(EMPTY_QUICK_FORM);
    setShowQuickCreate(false);
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    const supabase = createClient();
    await supabase.from("consultations").update({ status }).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  async function saveCallLog(id: string) {
    const draft = logDrafts[id];
    if (draft === undefined) return;
    setSavingId(id);
    const supabase = createClient();
    await supabase.from("consultations").update({ call_log: draft }).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  async function sendWithdrawalNotice(id: string) {
    setSavingId(id);
    const supabase = createClient();
    await supabase
      .from("consultations")
      .update({ withdrawal_notice_sent_at: new Date().toISOString() })
      .eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowQuickCreate((v) => !v)}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
        >
          {showQuickCreate ? "닫기" : "+ 전화상담 즉석등록"}
        </button>
      </div>

      {showQuickCreate && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-[var(--brand-navy)]">전화상담 즉석등록</p>
          <p className="mt-1 text-xs text-gray-500">
            전화로 접수한 상담을 여기서 리드+상담 건으로 동시에 생성합니다. 온라인 상담 신청 폼으로
            들어온 리드는 아래 &quot;미배정 리드&quot; 목록에서 전환해 주세요.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={quickForm.categoryId}
              onChange={(e) => setQuickForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">카테고리 선택</option>
              {consultCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={quickForm.name}
              onChange={(e) => setQuickForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="고객 이름"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={quickForm.phone}
              onChange={(e) => setQuickForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="연락처"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={quickForm.memo}
              onChange={(e) => setQuickForm((f) => ({ ...f, memo: e.target.value }))}
              placeholder="메모(선택)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={quickForm.consentObtained}
              onChange={(e) => setQuickForm((f) => ({ ...f, consentObtained: e.target.checked }))}
            />
            전화 통화로 개인정보 수집·이용 동의를 받았습니다.
          </label>

          {formError && <p className="mt-3 text-xs text-red-600">{formError}</p>}

          <button
            type="button"
            onClick={handleQuickCreate}
            disabled={submitting}
            className="mt-4 rounded-full bg-[var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      )}

      {unassignedLeads.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">미배정 리드 ({unassignedLeads.length}건)</p>
          <p className="mt-1 text-xs text-amber-700">
            온라인 상담 신청 폼(또는 기타 경로)으로 접수되었지만 아직 상담 건으로 전환되지 않은 리드입니다.
          </p>
          {convertError && <p className="mt-2 text-xs text-red-600">{convertError}</p>}
          <div className="mt-3 space-y-2">
            {unassignedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white px-4 py-3"
              >
                <div className="text-sm">
                  <span className="font-semibold">{contactName(lead.guest_contact)}</span>
                  <span className="ml-2 text-gray-500">{contactPhone(lead.guest_contact)}</span>
                  <span className="ml-2 text-xs text-gray-400">{lead.categories?.name ?? "-"}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => convertLead(lead.id)}
                  disabled={savingId === lead.id}
                  className="rounded-full bg-[var(--brand-navy)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {savingId === lead.id ? "전환 중..." : "상담으로 전환"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {consultations.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 상담이 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {consultations.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">{contactName(c.leads?.guest_contact ?? null)}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {contactPhone(c.leads?.guest_contact ?? null)}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{c.leads?.categories?.name ?? "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      STATUS_STYLE[c.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {STATUS_OPTIONS.find((o) => o.value === c.status)?.label ?? c.status}
                  </span>
                  <select
                    value={c.status}
                    disabled={savingId === c.id}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={logDrafts[c.id] ?? c.call_log ?? ""}
                onChange={(e) => setLogDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                onBlur={() => saveCallLog(c.id)}
                placeholder="상담 내용 메모"
                rows={2}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  접수 {new Date(c.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                {c.withdrawal_notice_sent_at ? (
                  <span className="text-xs font-semibold text-green-600">
                    청약철회 안내 발송완료 (
                    {new Date(c.withdrawal_notice_sent_at).toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    )
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendWithdrawalNotice(c.id)}
                    disabled={savingId === c.id}
                    className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
                  >
                    청약철회 안내 발송 처리(법정 필수)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
