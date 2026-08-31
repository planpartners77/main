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

-- profiles: 본인 행만 조회/수정/생성 가능. 회원가입 직후에는 이메일 인증 대기 등으로
-- 세션(access token)이 아직 없을 수 있어 클라이언트가 직접 insert하면 auth.uid()가 null이라
-- RLS에 막힐 수 있다 — 그래서 insert는 아래 handle_new_user 트리거(security definer)가
-- auth.users 생성 시점에 대신 수행한다. profiles_insert_own은 추후 클라이언트 쪽에서
-- 프로필 보완 등으로 직접 insert가 필요해질 상황을 대비한 보조 정책이다.
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- 회원가입(auth.users insert) 시 signUp()의 options.data로 전달한 메타데이터로
-- profiles 행을 자동 생성. RLS를 우회해야 하므로 security definer로 선언한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone, marketing_opt_in)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
