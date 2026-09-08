"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicPopup } from "@/lib/design/public-queries";

// 한 화면에 동시에 띄울 최대 팝업 수 — 그 이상 활성화돼 있어도 sort_order 순으로 앞의 2개만 노출.
const MAX_VISIBLE_POPUPS = 2;

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

function usePopupBody(popup: PublicPopup, onLinkClick: () => void) {
  const content = (
    <>
      <p className="font-semibold text-[var(--brand-navy)]">{popup.title}</p>
      {popup.body && <p className="mt-1 text-sm text-gray-600">{popup.body}</p>}
    </>
  );
  return popup.link_url ? (
    <Link href={popup.link_url} onClick={onLinkClick}>
      {content}
    </Link>
  ) : (
    content
  );
}

// 2개 이상 layer 팝업이 동시에 뜰 때 겹치지 않고 나란히 놓이도록 카드 너비를 좁혀서 렌더링.
function LayerPopup({
  popup,
  compact,
  onClose,
  onDismiss,
}: {
  popup: PublicPopup;
  compact: boolean;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const handleLinkClick = () => trackPopup("click", popup.id);
  const body = usePopupBody(popup, handleLinkClick);

  return (
    <div
      className={`max-h-[85vh] w-full ${compact ? "max-w-xs" : "max-w-sm"} overflow-y-auto rounded-2xl bg-white shadow-xl`}
    >
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
        <button onClick={onDismiss} className="flex-1 py-3 text-gray-400 hover:bg-gray-50">
          {dismissButtonLabel(popup.dismiss_days)}
        </button>
        <button
          onClick={onClose}
          className="flex-1 border-l border-gray-100 py-3 text-[var(--brand-navy)] hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function BarPopup({
  popup,
  onClose,
  onDismiss,
}: {
  popup: PublicPopup;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const handleLinkClick = () => trackPopup("click", popup.id);
  const body = usePopupBody(popup, handleLinkClick);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="text-sm">{body}</div>
        <div className="flex shrink-0 items-center gap-4 text-xs text-gray-400">
          <button onClick={onDismiss}>{dismissButtonLabel(popup.dismiss_days)}</button>
          <button onClick={onClose} className="font-semibold text-gray-600">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function SitePopup({ popups }: { popups: PublicPopup[] }) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const trackedImpressions = useRef(new Set<string>());

  useEffect(() => {
    setVisibleIds(
      popups
        .filter((p) => !isDismissedToday(p.id))
        .slice(0, MAX_VISIBLE_POPUPS)
        .map((p) => p.id),
    );
  }, [popups]);

  const visiblePopups = popups.filter((p) => visibleIds.includes(p.id));

  useEffect(() => {
    for (const popup of visiblePopups) {
      if (trackedImpressions.current.has(popup.id)) continue;
      trackedImpressions.current.add(popup.id);
      trackPopup("impression", popup.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visiblePopups는 visibleIds에서 파생, id 목록만 보면 됨
  }, [visibleIds]);

  if (visiblePopups.length === 0) return null;

  const close = (id: string) => setVisibleIds((ids) => ids.filter((v) => v !== id));
  const closeAndDismiss = (popup: PublicPopup) => {
    dismissFor(popup.id, popup.dismiss_days);
    close(popup.id);
  };

  const layerPopups = visiblePopups.filter((p) => p.display_type !== "bottom_bar");
  const barPopups = visiblePopups.filter((p) => p.display_type === "bottom_bar");

  return (
    <>
      {layerPopups.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-wrap items-center justify-center gap-4 bg-black/40 px-4">
          {layerPopups.map((popup) => (
            <LayerPopup
              key={popup.id}
              popup={popup}
              compact={layerPopups.length > 1}
              onClose={() => close(popup.id)}
              onDismiss={() => closeAndDismiss(popup)}
            />
          ))}
        </div>
      )}
      {barPopups.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col-reverse">
          {barPopups.map((popup) => (
            <BarPopup
              key={popup.id}
              popup={popup}
              onClose={() => close(popup.id)}
              onDismiss={() => closeAndDismiss(popup)}
            />
          ))}
        </div>
      )}
    </>
  );
}
