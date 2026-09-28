"use client";

import { EMPTY_LANDING_PAGE_EXTRA, normalizeLandingPageExtra, type LandingPageExtra } from "@/lib/landing/page-spec";
import { ProductDetailHtmlField } from "./ProductDetailHtmlField";

export function parseLandingExtra(raw: string): LandingPageExtra {
  if (!raw.trim()) return { ...EMPTY_LANDING_PAGE_EXTRA };
  try {
    return normalizeLandingPageExtra(JSON.parse(raw));
  } catch {
    return { ...EMPTY_LANDING_PAGE_EXTRA };
  }
}

function updateLeadForm(value: LandingPageExtra, patch: Partial<LandingPageExtra["lead_form"]>): LandingPageExtra {
  return { ...value, lead_form: { ...value.lead_form, ...patch } };
}

// 콤마로 구분된 시간대 옵션 입력 <-> string[] 왕복 변환.
function parseTimeOptionsInput(raw: string): string[] | null {
  const options = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return options.length > 0 ? options : null;
}

export function LandingPageSpecFields({
  value,
  onChange,
  productTitle,
  resetKey,
}: {
  value: LandingPageExtra;
  onChange: (next: LandingPageExtra) => void;
  productTitle?: string;
  resetKey?: number | string;
}) {
  const leadForm = value.lead_form;

  return (
    <div className="col-span-1 grid gap-4 sm:col-span-2">
      <ProductDetailHtmlField
        key={resetKey}
        html={value.detail_html}
        show={value.show_detail_html}
        onChangeHtml={(html) => onChange({ ...value, detail_html: html })}
        onChangeShow={(show) => onChange({ ...value, show_detail_html: show })}
      />

      <div className="grid gap-2 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4">
        <p className="text-xs font-bold text-[var(--brand-blue-dark)]">상담 신청 폼 종류</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="form_type"
              checked={value.form_type === "simple"}
              onChange={() => onChange({ ...value, form_type: "simple" })}
            />
            간단 상담 신청 (이름/연락처/시간대/문의내용)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="form_type"
              checked={value.form_type === "insurance_consult"}
              onChange={() => onChange({ ...value, form_type: "insurance_consult" })}
            />
            보험 상담 신청 (보험종류/성명/생년월일/통신사/가입 전 알릴의무 등)
          </label>
        </div>
      </div>

      {value.form_type === "simple" && (
      <div className="grid gap-2 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4 sm:grid-cols-2">
        <p className="text-xs font-bold text-[var(--brand-blue-dark)] sm:col-span-2">
          상담 신청 폼 문구 (비워두면 기본 문구 사용)
        </p>
        <label className="text-sm sm:col-span-2">
          제목
          <input
            value={leadForm.title ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { title: e.target.value || null }))}
            placeholder={`${productTitle || "상품명"} 상담 신청`}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          부제
          <input
            value={leadForm.subtitle ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { subtitle: e.target.value || null }))}
            placeholder="셀프가입이 아닌 상담 예약 신청입니다. 즉시 결제·가입은 진행되지 않습니다."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          상담 희망 시간대 옵션 (콤마로 구분)
          <input
            value={leadForm.preferred_time_options?.join(", ") ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { preferred_time_options: parseTimeOptionsInput(e.target.value) }))}
            placeholder="평일 오전, 평일 오후, 저녁(18시 이후), 주말"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          문의 내용 필드 라벨
          <input
            value={leadForm.memo_label ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { memo_label: e.target.value || null }))}
            placeholder="문의 내용(선택)"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          제출 버튼 문구
          <input
            value={leadForm.button_label ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { button_label: e.target.value || null }))}
            placeholder="무료 상담 예약하기"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          개인정보 동의 문구
          <input
            value={leadForm.consent_privacy_label ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { consent_privacy_label: e.target.value || null }))}
            placeholder="(필수) 상담을 위한 개인정보 수집·이용에 동의합니다."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          제3자 제공 동의 문구
          <input
            value={leadForm.consent_third_party_label ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { consent_third_party_label: e.target.value || null }))}
            placeholder="(필수) 상담 연계를 위해 제휴 상담사에게 정보가 제공됨에 동의합니다."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          제출 완료 제목
          <input
            value={leadForm.success_title ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { success_title: e.target.value || null }))}
            placeholder="상담 신청이 접수되었습니다."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          제출 완료 안내 문구
          <textarea
            value={leadForm.success_message ?? ""}
            onChange={(e) => onChange(updateLeadForm(value, { success_message: e.target.value || null }))}
            rows={2}
            placeholder="담당 상담사가 배정되어 남겨주신 연락처로 순차 연락드립니다..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      )}
    </div>
  );
}
