"use client";

import { Fragment } from "react";
import { LeadMemoField } from "./LeadMemoField";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { getFieldLabel, getConsentLabel, formatFieldValue } from "@/lib/admin/lead-field-labels";
import type { LeadRow } from "@/lib/admin/leads";

// guest_contact/consent은 카테고리마다 필드 구성이 완전히 달라(5~15개) 고정 컬럼으로 표현할 수
// 없다 — 저장된 키를 그대로 순회해 label:value로 렌더링하는 범용 상세 패널.
// guest_contact은 사용자가 브라우저에서 직접 보낸 값이라 절대 dangerouslySetInnerHTML로
// 렌더링하지 않는다(XSS 위험) — formatFieldValue는 항상 순수 문자열을 반환한다.
export function LeadDetailPanel({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const categorySlug = lead.categories?.slug;
  const contactEntries = Object.entries(lead.guest_contact ?? {});
  const consentEntries = Object.entries(lead.consent ?? {});
  const hasAttribution =
    lead.referrer_url || lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.referral_code_id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--brand-navy)]">신청 상세</h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
            닫기 ✕
          </button>
        </div>

        <section className="mt-5">
          <p className="text-xs font-bold text-gray-400">기본 정보</p>
          <dl className="mt-2 grid grid-cols-3 gap-y-1.5 text-sm">
            <dt className="text-gray-500">접수일시</dt>
            <dd className="col-span-2">
              {new Date(lead.created_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
            </dd>
            <dt className="text-gray-500">카테고리</dt>
            <dd className="col-span-2">{lead.categories?.name ?? "-"}</dd>
            <dt className="text-gray-500">상품/프로그램</dt>
            <dd className="col-span-2">{lead.products?.title ?? "-"}</dd>
            <dt className="text-gray-500">상태</dt>
            <dd className="col-span-2">
              <LeadStatusSelect leadId={lead.id} status={lead.status} referralCodeId={lead.referral_code_id} />
            </dd>
          </dl>
        </section>

        <section className="mt-5">
          <p className="text-xs font-bold text-gray-400">신청서 내용</p>
          {contactEntries.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">제출된 내용이 없습니다.</p>
          ) : (
            <dl className="mt-2 grid grid-cols-3 gap-y-1.5 text-sm">
              {contactEntries.map(([key, val]) => (
                <Fragment key={key}>
                  <dt className="text-gray-500">{getFieldLabel(categorySlug, key)}</dt>
                  <dd className="col-span-2 whitespace-pre-wrap break-words">{formatFieldValue(val)}</dd>
                </Fragment>
              ))}
            </dl>
          )}
        </section>

        {consentEntries.length > 0 && (
          <section className="mt-5">
            <p className="text-xs font-bold text-gray-400">동의 내역</p>
            <dl className="mt-2 grid grid-cols-3 gap-y-1.5 text-sm">
              {consentEntries.map(([key, val]) => (
                <Fragment key={key}>
                  <dt className="text-gray-500">{getConsentLabel(key)}</dt>
                  <dd className="col-span-2">{formatFieldValue(val)}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        )}

        {hasAttribution && (
          <section className="mt-5">
            <p className="text-xs font-bold text-gray-400">유입 경로</p>
            <dl className="mt-2 grid grid-cols-3 gap-y-1.5 text-sm">
              {lead.referrer_url && (
                <Fragment>
                  <dt className="text-gray-500">유입 URL</dt>
                  <dd className="col-span-2 break-all">{lead.referrer_url}</dd>
                </Fragment>
              )}
              {lead.utm_source && (
                <Fragment>
                  <dt className="text-gray-500">UTM Source</dt>
                  <dd className="col-span-2">{lead.utm_source}</dd>
                </Fragment>
              )}
              {lead.utm_medium && (
                <Fragment>
                  <dt className="text-gray-500">UTM Medium</dt>
                  <dd className="col-span-2">{lead.utm_medium}</dd>
                </Fragment>
              )}
              {lead.utm_campaign && (
                <Fragment>
                  <dt className="text-gray-500">UTM Campaign</dt>
                  <dd className="col-span-2">{lead.utm_campaign}</dd>
                </Fragment>
              )}
              {lead.referral_code_id && (
                <Fragment>
                  <dt className="text-gray-500">추천 코드</dt>
                  <dd className="col-span-2">연결됨</dd>
                </Fragment>
              )}
            </dl>
          </section>
        )}

        <section className="mt-5">
          <p className="text-xs font-bold text-gray-400">내부 메모</p>
          <div className="mt-2">
            <LeadMemoField leadId={lead.id} memo={lead.admin_memo} />
          </div>
        </section>
      </div>
    </div>
  );
}
