"use client";

import { useState } from "react";

export function ReferralShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url).then(() => {
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
