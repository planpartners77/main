-- 관리자 통계 페이지의 "접속자 현황"/"일 접속자 현황" 요구사항: 사이트 전역 페이지뷰를
-- proxy.ts에서 비동기(waitUntil)로 기록한다. referral_clicks(0001_init.sql)의 ip/user_agent
-- 원본 저장 방식을 그대로 따르고, 기기/브라우저 파싱은 조회 시점(lib/admin/visitor-parse.ts)에 한다.
create table visitor_logs (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  user_id uuid references profiles(id) on delete set null,
  ip text,
  user_agent text,
  path text,
  created_at timestamptz default now()
);

create index visitor_logs_created_at_idx on visitor_logs (created_at desc);
create index visitor_logs_visitor_id_idx on visitor_logs (visitor_id);

alter table visitor_logs enable row level security;

-- 방문 기록은 누구나(비로그인 포함) 남길 수 있어야 하고, update·delete 정책은 두지 않아
-- 기본적으로 차단된다(audit_logs와 동일한 위변조 방지 취지, §10-3).
create policy "visitor_logs_insert_public" on visitor_logs
  for insert with check (true);

create policy "visitor_logs_select_admin" on visitor_logs
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
