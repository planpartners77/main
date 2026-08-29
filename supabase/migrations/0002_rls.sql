-- RLS 정책 초안 (가이드 §10-3의 방향성을 구체적인 정책으로 구현)
-- 이 파일은 첫 구현 시안이다. 실제 서비스 오픈 전 보안 검토가 필요하다(특히
-- managed_categories의 저장 형식이 카테고리 id 배열이라고 가정하고 작성했음).

alter table profiles enable row level security;
alter table leads enable row level security;
alter table consultations enable row level security;
alter table products enable row level security;
alter table audit_logs enable row level security;

-- 현재 로그인한 관리자가 해당 카테고리를 담당하는지(super_admin이면 전체 허용) 확인하는 헬퍼
create or replace function is_admin_for_category(target_category_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid()
      and (
        role = 'super_admin'
        or managed_categories @> to_jsonb(target_category_id::text)
      )
  );
$$;

-- profiles: 본인 행만 조회/수정 가능
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- leads: 본인이 신청한 건 또는 담당 카테고리 관리자만 조회. 비회원 신청(guest)은
-- user_id가 null이므로 select 정책 대상이 아니며, 관리자 조회만 가능하다.
create policy "leads_select_own_or_admin" on leads
  for select using (auth.uid() = user_id or is_admin_for_category(category_id));
create policy "leads_insert_self_or_guest" on leads
  for insert with check (auth.uid() = user_id or user_id is null);

-- consultations: 연결된 lead의 소유자 또는 담당 관리자만 조회
create policy "consultations_select_own_or_admin" on consultations
  for select using (
    exists (
      select 1 from leads
      where leads.id = consultations.lead_id
        and (leads.user_id = auth.uid() or is_admin_for_category(leads.category_id))
    )
  );

-- products: 활성 상품은 공개 랜딩/비교 페이지에서 비회원도 조회 가능, 쓰기는 담당 관리자만
create policy "products_select_active" on products
  for select using (is_active = true);
create policy "products_write_admin" on products
  for all using (is_admin_for_category(category_id)) with check (is_admin_for_category(category_id));

-- audit_logs: insert만 허용(트리거/서버 코드에서 기록), update·delete는 정책을 두지 않아
-- RLS 활성화 상태에서 기본적으로 차단됨 — 감사 기록 위변조 방지(§10-3)
create policy "audit_logs_insert_only" on audit_logs
  for insert with check (true);
