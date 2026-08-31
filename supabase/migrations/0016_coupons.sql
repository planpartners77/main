-- Phase 3: 쿠폰제도. 사용자가 선택한 방식(신청서에 코드 직접 입력) 기준으로
-- coupons/coupon_redemptions를 두고, 검증·발급은 전부 security definer 함수로만 처리한다
-- (coupons 테이블 자체는 관리자만 select 가능 — 클라이언트는 코드 문자열 자체를 알아야만
-- 함수를 통해 검증할 수 있으므로 목록을 훔쳐볼 수 없다).
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value numeric not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  category_id uuid references categories(id),
  min_tier_id uuid references customer_tiers(id),
  max_redemptions int,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table coupons enable row level security;

create policy "coupons_all_admin" on coupons
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- profile_id는 비회원(guest) 신청 시 null — 등급 조건(min_tier_id)이 없는 쿠폰은 비회원도
-- 사용 가능하고, 있는 쿠폰은 함수 안에서 로그인을 강제한다.
create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references coupons(id) not null,
  profile_id uuid references profiles(id),
  lead_id uuid references leads(id) not null,
  redeemed_at timestamptz default now(),
  unique (coupon_id, lead_id)
);

alter table coupon_redemptions enable row level security;

create policy "coupon_redemptions_select_own" on coupon_redemptions
  for select using (auth.uid() = profile_id);

create policy "coupon_redemptions_select_admin" on coupon_redemptions
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- 신청서 제출 전 "적용" 버튼에서 부작용 없이 미리 확인만 하기 위한 함수.
create or replace function fn_validate_coupon(p_code text, p_profile_id uuid, p_category_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
  v_profile_rate numeric;
  v_required_rate numeric;
  v_redemption_count int;
begin
  select * into v_coupon from coupons where code = p_code;

  if not found then
    return jsonb_build_object('valid', false, 'error', '존재하지 않는 쿠폰 코드입니다.');
  end if;

  if not v_coupon.is_active then
    return jsonb_build_object('valid', false, 'error', '비활성화된 쿠폰입니다.');
  end if;

  if now() < v_coupon.valid_from or (v_coupon.valid_until is not null and now() > v_coupon.valid_until) then
    return jsonb_build_object('valid', false, 'error', '유효 기간이 지났거나 아직 시작되지 않은 쿠폰입니다.');
  end if;

  if v_coupon.category_id is not null and v_coupon.category_id is distinct from p_category_id then
    return jsonb_build_object('valid', false, 'error', '이 카테고리에는 사용할 수 없는 쿠폰입니다.');
  end if;

  if v_coupon.min_tier_id is not null then
    if p_profile_id is null then
      return jsonb_build_object('valid', false, 'error', '로그인 후 이용 가능한 쿠폰입니다.');
    end if;

    select customer_tiers.point_earn_rate into v_profile_rate
    from profiles
    join customer_tiers on customer_tiers.id = profiles.tier_id
    where profiles.id = p_profile_id;

    select point_earn_rate into v_required_rate from customer_tiers where id = v_coupon.min_tier_id;

    if v_profile_rate is null or v_profile_rate < v_required_rate then
      return jsonb_build_object('valid', false, 'error', '등급 조건을 만족하지 않는 쿠폰입니다.');
    end if;
  end if;

  if v_coupon.max_redemptions is not null then
    select count(*) into v_redemption_count from coupon_redemptions where coupon_id = v_coupon.id;
    if v_redemption_count >= v_coupon.max_redemptions then
      return jsonb_build_object('valid', false, 'error', '선착순 사용 횟수가 마감된 쿠폰입니다.');
    end if;
  end if;

  return jsonb_build_object('valid', true, 'discount_type', v_coupon.discount_type, 'discount_value', v_coupon.discount_value);
end;
$$;

-- 신청서 제출(leads insert) 직후 실제로 적립을 확정하는 함수. validate와 동일한 조건을
-- for update로 다시 잠그고 검사해 "적용" 버튼을 누른 시점과 최종 제출 시점 사이의
-- 동시성 레이스(막차 max_redemptions 초과 등)를 막는다.
create or replace function fn_redeem_coupon(p_code text, p_lead_id uuid, p_profile_id uuid, p_category_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
  v_profile_rate numeric;
  v_required_rate numeric;
  v_redemption_count int;
begin
  select * into v_coupon from coupons where code = p_code for update;

  if not found or not v_coupon.is_active then
    return jsonb_build_object('valid', false, 'error', '유효하지 않은 쿠폰입니다.');
  end if;

  if now() < v_coupon.valid_from or (v_coupon.valid_until is not null and now() > v_coupon.valid_until) then
    return jsonb_build_object('valid', false, 'error', '유효 기간이 지났거나 아직 시작되지 않은 쿠폰입니다.');
  end if;

  if v_coupon.category_id is not null and v_coupon.category_id is distinct from p_category_id then
    return jsonb_build_object('valid', false, 'error', '이 카테고리에는 사용할 수 없는 쿠폰입니다.');
  end if;

  if v_coupon.min_tier_id is not null then
    if p_profile_id is null then
      return jsonb_build_object('valid', false, 'error', '로그인 후 이용 가능한 쿠폰입니다.');
    end if;

    select customer_tiers.point_earn_rate into v_profile_rate
    from profiles
    join customer_tiers on customer_tiers.id = profiles.tier_id
    where profiles.id = p_profile_id;

    select point_earn_rate into v_required_rate from customer_tiers where id = v_coupon.min_tier_id;

    if v_profile_rate is null or v_profile_rate < v_required_rate then
      return jsonb_build_object('valid', false, 'error', '등급 조건을 만족하지 않는 쿠폰입니다.');
    end if;
  end if;

  if v_coupon.max_redemptions is not null then
    select count(*) into v_redemption_count from coupon_redemptions where coupon_id = v_coupon.id;
    if v_redemption_count >= v_coupon.max_redemptions then
      return jsonb_build_object('valid', false, 'error', '선착순 사용 횟수가 마감된 쿠폰입니다.');
    end if;
  end if;

  insert into coupon_redemptions (coupon_id, profile_id, lead_id)
  values (v_coupon.id, p_profile_id, p_lead_id)
  on conflict (coupon_id, lead_id) do nothing;

  return jsonb_build_object('valid', true, 'discount_type', v_coupon.discount_type, 'discount_value', v_coupon.discount_value);
end;
$$;

grant execute on function fn_validate_coupon(text, uuid, uuid) to anon, authenticated;
grant execute on function fn_redeem_coupon(text, uuid, uuid, uuid) to anon, authenticated;
