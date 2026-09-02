"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const prev = value;
    setValue(next);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("leads").update({ status: next }).eq("id", leadId);

    setSaving(false);
    if (error) {
      setValue(prev);
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
    >
      {LEAD_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
