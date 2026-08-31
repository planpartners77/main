-- 가이드 §9-1 "사은품/정산 관리"(담당자 등록 → 팀장 승인 → 지급 2단계 프로세스) 및
-- §10-1 ERD의 PARTNERS ||--o{ SETTLEMENTS 관계는 0001_init.sql에 테이블 자체가 누락되어 있었다.
-- admin_users.role에는 이미 'settlement_manager'가 존재하므로(0001) 이번에 테이블+정책만 추가한다.
create table settlements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) not null,
  lead_id uuid references leads(id),
  amount numeric not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid', 'rejected')),
  memo text,
  created_by uuid references admin_users(id),
  approved_by uuid references admin_users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table settlements enable row level security;

-- 정산은 카테고리 담당자가 아니라 §9-2 RBAC상 "정산 담당자"(settlement_manager) 또는
-- super_admin 전용 화면이므로, 다른 모듈처럼 is_admin_for_category가 아닌 role 직접 체크를 쓴다.
create policy "settlements_settlement_role_all" on settlements
  for all using (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
        and admin_users.role in ('settlement_manager', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
        and admin_users.role in ('settlement_manager', 'super_admin')
    )
  );
