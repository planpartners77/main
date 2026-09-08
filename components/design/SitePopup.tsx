"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicPopup } from "@/lib/design/public-queries";

function dismissKey(id: string) {
  return `pp_popup_dismiss_${id}`;
}

function isDismissedToday(id: string) {
  if (typeof window === "undefined") return false;
  try {
    const until = localStorage.getItem(dismissKey(id));
    return !!until && Date.now() < Number(until);
  } catch {
    return false;
  }
}

function dismissFor(id: string, days: number) {
  try {
    localStorage.setItem(dismissKey(id), String(Date.now() + days * 24 * 60 * 60 * 1000));
  } catch {
    // 프라이빗 브라우징 등으로 저장이 막혀도 팝업 표시 자체는 계속 동작해야 하므로 무시
  }
}

// 관리자가 팝업별로 고를 수 있는 프리셋(PopupManager의 select와 값이 일치해야 함).
function dismissButtonLabel(days: number) {
  if (days >= 365) return "다시 보지 않기";
  if (days <= 1) return "오늘 하루 보지 않기";
  return `${days}일간 보지 않기`;
}

function trackPopup(type: "impression" | "click", popupId: string) {
  fetch("/api/popup-track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, popupId }),
    keepalive: true,
  }).catch(() => {});
}

export function SitePopup({ popups }: { popups: PublicPopup[] }) {
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const trackedImpressions = useRef(new Set<string>());

  useEffect(() => {
    setVisibleId(popups.find((p) => !isDismissedToday(p.id))?.id ?? null);
  }, [popups]);

  const popup = popups.find((p) => p.id === visibleId);

  useEffect(() => {
    if (!popup || trackedImpressions.current.has(popup.id)) return;
    trackedImpressions.current.add(popup.id);
    trackPopup("impression", popup.id);
  }, [popup]);

  if (!popup) return null;

  const close = () => setVisibleId(null);
  const closeAndDismiss = () => {
    dismissFor(popup.id, popup.dismiss_days);
    close();
  };
  const handleLinkClick = () => trackPopup("click", popup.id);

  const content = (
    <>
      <p className="font-semibold text-[var(--brand-navy)]">{popup.title}</p>
      {popup.body && <p className="mt-1 text-sm text-gray-600">{popup.body}</p>}
    </>
  );
  const body = popup.link_url ? (
    <Link href={popup.link_url} onClick={handleLinkClick}>
      {content}
    </Link>
  ) : (
    content
  );

  if (popup.display_type === "bottom_bar") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm">{body}</div>
          <div className="flex shrink-0 items-center gap-4 text-xs text-gray-400">
            <button onClick={closeAndDismiss}>{dismissButtonLabel(popup.dismiss_days)}</button>
            <button onClick={close} className="font-semibold text-gray-600">
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white">
        {popup.image_url &&
          (popup.link_url ? (
            <Link href={popup.link_url} onClick={handleLinkClick}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션 */}
              <img src={popup.image_url} alt={popup.title} className="w-full object-contain" />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션
            <img src={popup.image_url} alt={popup.title} className="w-full object-contain" />
          ))}
        <div className="p-5">{body}</div>
        <div className="flex border-t border-gray-100 text-xs font-semibold">
          <button onClick={closeAndDismiss} className="flex-1 py-3 text-gray-400 hover:bg-gray-50">
            {dismissButtonLabel(popup.dismiss_days)}
          </button>
          <button
            onClick={close}
            className="flex-1 border-l border-gray-100 py-3 text-[var(--brand-navy)] hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
