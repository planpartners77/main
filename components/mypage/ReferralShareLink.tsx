"use client";

import { useState } from "react";

export function ReferralShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = new URL(window.location.origin);
    url.searchParams.set("ref", code);
    url.searchParams.set("utm_source", "member_referral");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", code);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
    >
      {copied ? "복사됨" : "추천 링크 복사"}
    </button>
  );
}
