"use client";

import { useEffect } from "react";
import { addRecentlyViewed, type RecentlyViewedPlan } from "@/lib/usim/recently-viewed";

export function RecordRecentView({ plan }: { plan: Omit<RecentlyViewedPlan, "viewed_at"> }) {
  useEffect(() => {
    addRecentlyViewed(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  return null;
}
