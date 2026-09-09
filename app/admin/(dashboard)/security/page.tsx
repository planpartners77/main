import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin/session";

const MULTI_ACCOUNT_WINDOW_DAYS = 7;
const MULTI_ACCOUNT_MIN_USERS = 2;
const FAILURE_BURST_WINDOW_HOURS = 24;
const FAILURE_BURST_MIN_COUNT = 5;
const TRAFFIC_WINDOW_MINUTES = 60;
const TRAFFIC_MIN_COUNT = 100;
const ROW_LIMIT = 5000;

interface LoginEventRow {
  ip: string | null;
  user_id: string | null;
  identifier: string | null;
  created_at: string;
}

interface VisitorLogRow {
  ip: string | null;
}

export default async function AdminSecurityPage() {
  const session = await getAdminSession();
  // 로그인 IP/실패 이력은 감사 로그와 동급의 민감 정보라 super_admin만 볼 수 있게 한다
  // (audit-logs/page.tsx와 동일한 이중 방어 — 미들웨어의 canAccessMenu와 별개로 페이지에서도 확인).
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = await createClient();

  // 1) 동일 IP에서 여러 계정이 로그인 성공한 경우 — 계정 탈취/공유 의심 신호.
  const multiAccountSince = new Date(
    new Date().getTime() - MULTI_ACCOUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: successRows } = await supabase
    .from("login_events")
    .select("ip, user_id, created_at")
    .eq("result", "success")
    .not("ip", "is", null)
    .gte("created_at", multiAccountSince)
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);

  const byIpUsers = new Map<string, { users: Set<string>; lastSeen: string }>();
  for (const row of (successRows ?? []) as LoginEventRow[]) {
    if (!row.ip || !row.user_id) continue;
    const entry = byIpUsers.get(row.ip) ?? { users: new Set<string>(), lastSeen: row.created_at };
    entry.users.add(row.user_id);
    if (row.created_at > entry.lastSeen) entry.lastSeen = row.created_at;
    byIpUsers.set(row.ip, entry);
  }
  const multiAccountIps = Array.from(byIpUsers.entries())
    .filter(([, v]) => v.users.size >= MULTI_ACCOUNT_MIN_USERS)
    .map(([ip, v]) => ({ ip, userCount: v.users.size, lastSeen: v.lastSeen }))
    .sort((a, b) => b.userCount - a.userCount);

  // 2) 로그인 실패가 짧은 시간에 몰린 IP — 무차별 대입/크리덴셜 스터핑 의심 신호.
  const failureSince = new Date(
    new Date().getTime() - FAILURE_BURST_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { data: failureRows } = await supabase
    .from("login_events")
    .select("ip, identifier, created_at")
    .eq("result", "failure")
    .not("ip", "is", null)
    .gte("created_at", failureSince)
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);

  const byIpFailures = new Map<string, { count: number; identifiers: Set<string>; lastSeen: string }>();
  for (const row of (failureRows ?? []) as LoginEventRow[]) {
    if (!row.ip) continue;
    const entry = byIpFailures.get(row.ip) ?? { count: 0, identifiers: new Set<string>(), lastSeen: row.created_at };
    entry.count += 1;
    if (row.identifier) entry.identifiers.add(row.identifier);
    if (row.created_at > entry.lastSeen) entry.lastSeen = row.created_at;
    byIpFailures.set(row.ip, entry);
  }
  const failureBurstIps = Array.from(byIpFailures.entries())
    .filter(([, v]) => v.count >= FAILURE_BURST_MIN_COUNT)
    .map(([ip, v]) => ({ ip, count: v.count, identifierCount: v.identifiers.size, lastSeen: v.lastSeen }))
    .sort((a, b) => b.count - a.count);

  // 3) 기존 visitor_logs(0020) 활용 — 짧은 시간에 페이지뷰가 급증한 IP(트래픽 스크래핑/봇 의심).
  const trafficSince = new Date(new Date().getTime() - TRAFFIC_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: visitorRows } = await supabase
    .from("visitor_logs")
    .select("ip")
    .not("ip", "is", null)
    .gte("created_at", trafficSince)
    .limit(ROW_LIMIT);

  const byIpTraffic = new Map<string, number>();
  for (const row of (visitorRows ?? []) as VisitorLogRow[]) {
    if (!row.ip) continue;
    byIpTraffic.set(row.ip, (byIpTraffic.get(row.ip) ?? 0) + 1);
  }
  const trafficSpikeIps = Array.from(byIpTraffic.entries())
    .filter(([, count]) => count >= TRAFFIC_MIN_COUNT)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">보안</h1>
      <p className="mt-1 text-sm text-gray-500">
        로그인/방문 기록에서 이상 패턴을 자동 집계해 보여줍니다. 실시간 차단 기능은 아니며, 참고용
        모니터링 화면입니다.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-bold text-[var(--brand-navy)]">
          동일 IP에서 {MULTI_ACCOUNT_MIN_USERS}개 이상 계정 로그인 (최근 {MULTI_ACCOUNT_WINDOW_DAYS}일)
        </h2>
        {multiAccountIps.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            해당하는 IP가 없습니다.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">계정 수</th>
                  <th className="px-4 py-2">최근 로그인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {multiAccountIps.map((row) => (
                  <tr key={row.ip}>
                    <td className="px-4 py-2 font-mono text-xs">{row.ip}</td>
                    <td className="px-4 py-2 text-xs font-semibold">{row.userCount}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(row.lastSeen).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-[var(--brand-navy)]">
          로그인 실패 다발 IP (최근 {FAILURE_BURST_WINDOW_HOURS}시간, {FAILURE_BURST_MIN_COUNT}회 이상)
        </h2>
        {failureBurstIps.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            해당하는 IP가 없습니다.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">실패 횟수</th>
                  <th className="px-4 py-2">시도한 계정 수</th>
                  <th className="px-4 py-2">최근 시도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {failureBurstIps.map((row) => (
                  <tr key={row.ip}>
                    <td className="px-4 py-2 font-mono text-xs">{row.ip}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-[var(--brand-urgent)]">{row.count}</td>
                    <td className="px-4 py-2 text-xs">{row.identifierCount}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(row.lastSeen).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-[var(--brand-navy)]">
          트래픽 급증 IP (최근 {TRAFFIC_WINDOW_MINUTES}분, {TRAFFIC_MIN_COUNT}회 이상 방문)
        </h2>
        {trafficSpikeIps.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            해당하는 IP가 없습니다.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">방문 횟수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trafficSpikeIps.map((row) => (
                  <tr key={row.ip}>
                    <td className="px-4 py-2 font-mono text-xs">{row.ip}</td>
                    <td className="px-4 py-2 text-xs font-semibold">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
