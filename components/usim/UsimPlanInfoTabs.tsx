"use client";

import { useState } from "react";
import {
  THROTTLE_SPEED_OPTIONS,
  callLabel,
  dataLabel,
  smsLabel,
  videoCallLabel,
  type UsimPlanExtra,
} from "@/lib/usim/plan-spec";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

const TABS = [
  { id: "basic", label: "기본 정보" },
  { id: "service", label: "지원 서비스" },
  { id: "cost", label: "기타 비용" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function simLabel(simType: UsimPlanExtra["sim_type"]) {
  if (simType === "usim") return "유심 개통 가능 / eSIM 불가";
  if (simType === "esim") return "eSIM 개통 가능 / 유심 불가";
  return "유심 · eSIM 모두 개통 가능";
}

export function UsimPlanInfoTabs({ extra }: { extra: UsimPlanExtra }) {
  const [tab, setTab] = useState<TabId>("basic");

  const throttleOption = THROTTLE_SPEED_OPTIONS.find((o) => o.value === extra.data_throttle_speed);

  const basicRows = [
    {
      icon: "📶",
      title: `데이터 월 ${dataLabel(extra.data_gb)}`,
      desc:
        extra.data_gb == null
          ? "얼마든지 빠른 속도로 사용해요"
          : extra.data_throttle_speed === "none"
            ? "소진 시 이용이 제한돼요"
            : `다 써도 ${throttleOption?.label ?? ""} 속도로 ${throttleOption?.helper ?? "이용"}`,
    },
    {
      icon: "📞",
      title: `${callLabel(extra.call_minutes)} / ${smsLabel(extra.sms_count)}`,
      desc: `${extra.carrier_network}망 · ${extra.network_tech}`,
    },
    ...(extra.video_call_minutes != null
      ? [
          {
            icon: "🎥",
            title: videoCallLabel(extra.video_call_minutes),
            desc: null,
          },
        ]
      : []),
    {
      icon: "📅",
      title: extra.contract_months > 0 ? `${extra.contract_months}개월 약정` : "약정 없음",
      desc: extra.internet_bundle ? (extra.bundle_benefit ?? "인터넷 결합 가능") : "인터넷 결합 불가",
    },
    {
      icon: "📱",
      title: simLabel(extra.sim_type),
      desc: null,
    },
  ];

  const hasEligibility = extra.tags.length > 0 || extra.eligibility_minor || extra.eligibility_foreigner;
  if (hasEligibility) {
    const parts = [...extra.tags.map((t) => `${t} 전용`)];
    if (extra.eligibility_minor) parts.push("미성년자 가입 가능");
    if (extra.eligibility_foreigner) parts.push("외국인 가입 가능");
    basicRows.push({ icon: "🪪", title: "가입 가능 대상", desc: parts.join(" · ") });
  }

  const serviceItems: { id: string; icon: string; label: string; available: boolean; detail: string | null }[] = [
    {
      id: "hotspot",
      icon: "📡",
      label: "모바일 핫스팟",
      available: (extra.hotspot_gb ?? 0) > 0,
      detail: extra.hotspot_gb != null ? `월 ${extra.hotspot_gb}GB 제공` : null,
    },
    {
      id: "share",
      icon: "🔀",
      label: "데이터 쉐어링",
      available: extra.features.includes("데이터쉐어링"),
      detail: null,
    },
    {
      id: "micropay",
      icon: "💳",
      label: "소액결제",
      available: extra.features.includes("소액결제"),
      detail: null,
    },
    {
      id: "roaming",
      icon: "✈️",
      label: "해외로밍",
      available: extra.features.includes("해외로밍"),
      detail: null,
    },
    {
      id: "nfc",
      icon: "🏷️",
      label: "NFC",
      available: extra.features.includes("NFC"),
      detail: null,
    },
    {
      id: "esim",
      icon: "💠",
      label: "eSIM",
      available: extra.features.includes("eSIM"),
      detail: null,
    },
    {
      id: "freesim",
      icon: "🎁",
      label: "유심 무료",
      available: extra.features.includes("유심무료"),
      detail: null,
    },
    {
      id: "wifi",
      icon: "🛜",
      label: "Wi-Fi 제공",
      available: extra.wifi_provided,
      detail: null,
    },
  ];

  const hasCostContent = !!extra.bundle_benefit || extra.extra_costs.length > 0 || extra.partner_benefits.length > 0;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-[var(--brand-navy)]">요금제 정보</h2>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-[var(--brand-navy)] shadow-sm" : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          {basicRows.map((row) => (
            <div key={row.title} className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 text-lg">{row.icon}</span>
              <div className="min-w-0 flex-1">
                <dt className="text-sm font-bold text-gray-800">{row.title}</dt>
                {row.desc && <dd className="mt-0.5 text-xs text-gray-400">{row.desc}</dd>}
              </div>
            </div>
          ))}
        </dl>
      )}

      {tab === "service" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {serviceItems.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 ${
                s.available ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
              }`}
            >
              <span className={`text-lg ${s.available ? "" : "opacity-30 grayscale"}`}>{s.available ? s.icon : "✕"}</span>
              <p className={`mt-2 text-sm font-bold ${s.available ? "text-gray-800" : "text-gray-400"}`}>{s.label}</p>
              {s.available && (
                <p className="mt-0.5 text-xs text-[var(--brand-blue)]">{s.detail ?? "이용 가능"}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "cost" && (
        <div className="mt-3 space-y-4">
          {extra.bundle_benefit && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-800">결합 혜택</p>
              <p className="mt-1 text-sm text-gray-600">{extra.bundle_benefit}</p>
            </div>
          )}

          {extra.extra_costs.length > 0 && (
            <dl className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {extra.extra_costs.map((cost, i) => (
                <div key={i} className="flex justify-between px-4 py-3.5 text-sm">
                  <dt className="text-gray-500">{cost.label}</dt>
                  <dd className="font-medium text-gray-800">{cost.amount === 0 ? "무료" : formatWon(cost.amount)}</dd>
                </div>
              ))}
            </dl>
          )}

          {extra.partner_benefits.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-800">제휴 혜택</p>
              <ul className="mt-2 space-y-1">
                {extra.partner_benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-1.5 text-sm text-gray-600">
                    <span className="text-[var(--brand-blue)]">·</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasCostContent && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
              등록된 기타 비용이 없어요
            </p>
          )}
        </div>
      )}
    </div>
  );
}
