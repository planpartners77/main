-- 디자인관리 2단계: 배너·팝업 (가이드 §9-1/§11-1 "디자인 통합관리 탭" 계속)
-- 이 둘은 노출기간(start_at/end_at)으로 필터링 조회해야 해서 site_settings의 jsonb 방식보다
-- 컬럼 테이블이 맞다(§Phase 5 계획 — 이미지관리는 0006에서 완료).

create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  category_id uuid references categories(id), -- null = 홈 전체 노출, 값 있으면 해당 카테고리 페이지 전용
  sort_order int not null default 0,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now()
);

create table popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  body text,
  link_url text,
  display_type text not null default 'layer' check (display_type in ('layer', 'bottom_bar')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now()
);

alter table banners enable row level security;
alter table popups enable row level security;

-- 공개 사이트는 활성 상태인 행만 볼 수 있고(날짜 범위 필터는 앱 쿼리에서 처리),
-- 관리자는 예약/종료/비활성 포함 전체를 봐야 하므로 두 정책을 OR로 함께 둔다
-- (products_select_active + products_write_admin과 동일한 패턴, §10-3).
create policy "banners_select_public_active" on banners
  for select using (is_active = true);
create policy "banners_select_admin_all" on banners
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "banners_write_admin" on banners
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

create policy "popups_select_public_active" on popups
  for select using (is_active = true);
create policy "popups_select_admin_all" on popups
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "popups_write_admin" on popups
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));
