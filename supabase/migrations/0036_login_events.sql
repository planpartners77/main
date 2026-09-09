-- 관리자 "보안" 메뉴 1단계: 로그인 성공/실패를 IP+UA+provider와 함께 기록해 "동일 IP 다계정
-- 로그인", "로그인 실패 다발" 같은 이상 패턴을 조회할 수 있게 한다. visitor_logs(0020)와 달리
-- 로그인 시도 자체를 남기며, 실패 사유(failure_reason)까지 함께 저장한다.
create table login_events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  identifier text,
  provider text not null check (provider in ('email', 'kakao', 'admin')),
  result text not null check (result in ('success', 'failure')),
  failure_reason text,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

create index login_events_created_at_idx on login_events (created_at desc);
create index login_events_ip_idx on login_events (ip);
create index login_events_user_id_idx on login_events (user_id);

alter table login_events enable row level security;

-- 로그인 실패 시점엔 아직 인증되지 않은 상태(또는 실패한 상태)라 누구나(비로그인 포함) 기록할
-- 수 있어야 한다(visitor_logs_insert_public과 동일 취지). update·delete 정책은 두지 않아
-- audit_logs와 동일하게 위변조를 막는다.
create policy "login_events_insert_public" on login_events
  for insert with check (true);

-- 로그인 IP/실패 이력은 감사 로그와 동급의 민감 정보라 super_admin만 조회 가능하게 한다
-- (0032의 audit_logs_select_super_admin과 동일 패턴).
create policy "login_events_select_super_admin" on login_events
  for select using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role = 'super_admin')
  );
