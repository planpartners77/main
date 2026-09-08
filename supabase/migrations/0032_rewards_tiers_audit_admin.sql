-- 관리자 페이지 피드백 반영 3종: 사은품 지급 명단 관리, 회원 등급 CRUD, 감사 로그 열람.

-- 1) 사은품 지급 명단: 지금까지 /rewards가 정적 빈 화면이었다. notices와 동일한 패턴
--    (공개 select는 게시된 것만, 관리자는 super_admin+content_manager만 쓰기).
create table reward_recipients (
  id uuid primary key default gen_random_uuid(),
  recipient_name text not null,
  reward_item text not null,
  category text,
  awarded_at date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index reward_recipients_awarded_at_idx on reward_recipients (awarded_at desc);

alter table reward_recipients enable row level security;

create policy "reward_recipients_select_public" on reward_recipients
  for select using (is_active = true);
create policy "reward_recipients_select_admin_all" on reward_recipients
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "reward_recipients_write_content_admin" on reward_recipients
  for all
  using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

-- 2) 회원 등급(customer_tiers): 0011에서 select만 열어뒀고 쓰기 정책이 없어 관리자 화면을
--    만들어도 저장이 불가능했다. 등급은 포인트 적립률에 직결되므로 회원 담당+super_admin만 허용.
create policy "customer_tiers_write_admin" on customer_tiers
  for all
  using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'member_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'member_manager'))
  );

-- 3) audit_logs: insert only 정책만 있고 select 정책이 전혀 없어 super_admin도 조회가
--    불가능했다(0002_rls.sql 주석대로 위변조 방지가 목적이라 update/delete는 계속 막되,
--    조회 자체는 열어준다). 개인정보 열람 이력이라 super_admin만 볼 수 있게 제한한다.
create policy "audit_logs_select_super_admin" on audit_logs
  for select using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role = 'super_admin')
  );
