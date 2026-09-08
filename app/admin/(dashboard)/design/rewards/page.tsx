import { createClient } from "@/lib/supabase/server";
import { RewardManager, type RewardRow } from "@/components/admin/design/RewardManager";

export default async function DesignRewardsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reward_recipients")
    .select("id, recipient_name, reward_item, category, awarded_at, is_active")
    .order("awarded_at", { ascending: false });
  return <RewardManager rewards={(data ?? []) as RewardRow[]} />;
}
