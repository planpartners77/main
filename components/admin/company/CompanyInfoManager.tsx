"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CompanyInfo } from "@/lib/design/site-settings";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--brand-navy)]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// mailOrderRegNo 등 4개 필드는 미확보 시 null로 저장돼야 footer에 "등록 후 반영 예정"이
// 표시된다(§ 정보 정확성 원칙 — 발급 전 임의 번호 금지). 빈 문자열 입력도 null로 취급한다.
function NullableTextField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  hint: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--brand-navy)]">{label}</label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.trim() === "" ? null : e.target.value)}
        placeholder="등록 후 반영 예정"
        className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

export function CompanyInfoManager({ info }: { info: CompanyInfo }) {
  const router = useRouter();
  const [form, setForm] = useState(info);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({
        value: {
          companyName: form.companyName.trim(),
          ceo: form.ceo.trim(),
          bizRegNo: form.bizRegNo.trim(),
          corpRegNo: form.corpRegNo.trim(),
          address: form.address.trim(),
          bizType: form.bizType.trim(),
          bizItem: form.bizItem.trim(),
          mailOrderRegNo: form.mailOrderRegNo,
          privacyOfficer: form.privacyOfficer,
          insuranceAgentRegNo: form.insuranceAgentRegNo,
          funeralInstallmentRegNo: form.funeralInstallmentRegNo,
          introText: form.introText.trim(),
          disclaimerText: form.disclaimerText.trim(),
        },
      })
      .eq("key", "company_info");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <TextField label="상호" value={form.companyName} onChange={(v) => set("companyName", v)} />
        <TextField label="대표자" value={form.ceo} onChange={(v) => set("ceo", v)} />
        <TextField label="사업자등록번호" value={form.bizRegNo} onChange={(v) => set("bizRegNo", v)} />
        <TextField label="법인등록번호" value={form.corpRegNo} onChange={(v) => set("corpRegNo", v)} />
        <TextField label="업태" value={form.bizType} onChange={(v) => set("bizType", v)} />
        <TextField label="종목" value={form.bizItem} onChange={(v) => set("bizItem", v)} />
        <div className="sm:col-span-2">
          <TextField label="주소" value={form.address} onChange={(v) => set("address", v)} />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <NullableTextField
          label="통신판매중개업 신고번호"
          value={form.mailOrderRegNo}
          onChange={(v) => set("mailOrderRegNo", v)}
          hint="등록 전이면 비워두세요 — 사이트에 '등록 후 반영 예정'으로 표시됩니다."
        />
        <NullableTextField
          label="개인정보 보호책임자"
          value={form.privacyOfficer}
          onChange={(v) => set("privacyOfficer", v)}
          hint="지정 전이면 비워두세요 — 사이트에 '등록 후 반영 예정'으로 표시됩니다."
        />
        <NullableTextField
          label="보험 모집인 등록번호"
          value={form.insuranceAgentRegNo}
          onChange={(v) => set("insuranceAgentRegNo", v)}
          hint="등록 전이면 비워두세요 — 사이트에 '등록 후 반영 예정'으로 표시됩니다."
        />
        <NullableTextField
          label="상조 선불식 할부거래업 등록번호"
          value={form.funeralInstallmentRegNo}
          onChange={(v) => set("funeralInstallmentRegNo", v)}
          hint="등록 전이면 비워두세요 — 사이트에 '등록 후 반영 예정'으로 표시됩니다."
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">푸터 상단 소개 문구</label>
        <textarea
          value={form.introText}
          onChange={(e) => set("introText", e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-[var(--brand-navy)]">통신판매중개자 고지 문구</label>
        <textarea
          value={form.disclaimerText}
          onChange={(e) => set("disclaimerText", e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          상호를 바꾸면 이 문구도 함께 고쳐야 내용이 맞습니다(자동으로 연동되지 않습니다).
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-[var(--brand-mint)]">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
