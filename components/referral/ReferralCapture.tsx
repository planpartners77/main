"use client";

import { useEffect } from "react";
import { recordReferralClick } from "@/lib/referral/client";

export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) recordReferralClick(code);
  }, []);

  return null;
}
