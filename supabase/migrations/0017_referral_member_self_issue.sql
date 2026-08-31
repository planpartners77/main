-- 추천인코드 핵심 알고리즘 이식 (Bizmobile 원본 lib/referral.ts 분석 기반).
-- 지금까지는 관리자가 파트너 코드를 수동 생성하는 것만 있었고, 회원가입 시 개인 추천코드를
-- 자동 발급하고 회원↔코드를 연결하는 부분이 전혀 없었다. 이번에 그 절반을 채운다.

-- 1) profiles: 파트너구분 + 본인 코드/추천인 코드 연결 컬럼.
--    referral_role은 partners 테이블(업체·공급사, 0001_init.sql)과 이름이 겹치는 걸 피하려고
--    "파트너"가 아니라 "referral_role"로 짓는다 — 둘은 완전히 다른 개념이다.
alter table profiles
  add column referral_role text not null default 'member' check (referral_role in ('member', 'partner')),
  add column my_ref_code_id uuid references referral_codes(id),
  add column referred_by_code_id uuid references referral_codes(id);

-- 2) referral_codes: 코드 소유자 역참조. 관리자가 만드는 파트너 코드는 계속 profile_id 없이 존재 가능.
alter table referral_codes
  add column profile_id uuid references profiles(id);

create index idx_referral_codes_profile_id on referral_codes(profile_id);

-- 3) referral_role/tier_id 자기 자신 승격 방지.
--    tier_id는 0001부터 profiles_update_own(행 단위 정책)만으로 보호되고 있어 회원이 직접
--    supabase-js로 자기 등급을 올려도 막을 방법이 없었다(컬럼 단위 문제라 RLS "using"만으론 못 막음).
--    이번에 referral_role을 추가하면서 같은 구멍이 하나 더 생기므로, 두 필드를 함께 막는
--    BEFORE UPDATE 트리거로 처리한다. auth.uid()가 null인 경우(서비스 롤/내부 트리거 호출)는
--    통과시켜야 handle_new_user 같은 내부 로직이 막히지 않는다.
create or replace function fn_guard_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (new.tier_id is distinct from old.tier_id or new.referral_role is distinct from old.referral_role)
     and not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'insufficient_privilege: tier_id/referral_role can only be changed by an admin';
  end if;
  return new;
end;
$$;

create trigger trg_guard_privileged_profile_fields
  before update on profiles
  for each row
  execute function fn_guard_privileged_profile_fields();

-- 4) handle_new_user 확장: 가입 시 추천코드 해석 + 개인 코드 자동 발급 + 가입전환 기록.
--    (Bizmobile lib/referral.ts의 resolveRefCode + issueRefCode를 하나의 트리거로 합친 것)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred_code text := nullif(upper(trim(new.raw_user_meta_data ->> 'referred_by_code')), '');
  v_resolved_id uuid;
  v_resolved_root uuid;
  v_resolved_depth int;
  v_new_code_id uuid;
  v_new_depth int;
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 0,1,I,O 등 혼동 문자 제외 (Bizmobile 원본과 동일)
  v_code_taken boolean;
  i int;
begin
  -- 4-1. 가입 시 사용된 추천코드 해석 (활성 + 미만료인 경우만 인정)
  if v_referred_code is not null then
    select id, coalesce(root_code_id, id), depth
      into v_resolved_id, v_resolved_root, v_resolved_depth
    from referral_codes
    where code = v_referred_code
      and is_active = true
      and (expires_at is null or expires_at > now());
  end if;

  v_new_depth := coalesce(v_resolved_depth, -1) + 1; -- 추천인 없으면 0(=자기 자신이 root), 있으면 부모+1

  -- 4-2. 신규 회원 코드 생성 (중복 시 최대 10회 재시도, 그래도 겹치면 타임스탬프로 강제 유니크화)
  for i in 1..10 loop
    v_code := 'M' || (
      select string_agg(substr(v_chars, (floor(random() * length(v_chars)) + 1)::int, 1), '')
      from generate_series(1, 7)
    );
    select exists(select 1 from referral_codes where code = v_code) into v_code_taken;
    exit when not v_code_taken;
  end loop;
  if v_code_taken then
    v_code := v_code || to_char((extract(epoch from clock_timestamp())::bigint % 1000), 'FM000');
  end if;

  -- 4-3. 프로필 먼저 생성. referral_codes.profile_id가 profiles를 참조하므로, 코드 발급보다
  --      프로필 insert가 먼저 있어야 한다(반대 순서면 FK 위반). my_ref_code_id는 코드 발급 후
  --      별도 update로 채운다.
  insert into public.profiles (id, display_name, phone, marketing_opt_in, referred_by_code_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    v_resolved_id
  );

  -- 4-4. 코드 발급 (parent/root/depth 연결). root_code_id는 부모가 없으면 자기 자신을 가리켜야
  --      하므로 ReferralManager.tsx와 동일하게 insert 후 update로 2단계 처리한다.
  insert into referral_codes (code, name, type, profile_id, parent_code_id, root_code_id, depth, is_active)
  values (
    v_code,
    new.raw_user_meta_data ->> 'display_name',
    'member',
    new.id,
    v_resolved_id,
    v_resolved_root,
    v_new_depth,
    true
  )
  returning id into v_new_code_id;

  if v_resolved_root is null then
    update referral_codes set root_code_id = v_new_code_id where id = v_new_code_id;
  end if;

  update public.profiles set my_ref_code_id = v_new_code_id where id = new.id;

  -- 4-5. 가입전환 기록 (추천인이 있었던 경우만). lead_id 없이(null) 회원가입 자체를 전환으로 남긴다.
  if v_resolved_id is not null then
    insert into referral_conversions (code_id, root_code_id, conversion_type, depth)
    values (v_resolved_id, v_resolved_root, 'registration', v_resolved_depth);
    perform increment_referral_conversion(v_resolved_id);
  end if;

  return new;
end;
$$;

-- 5) 마이페이지용 추천 현황 조회 함수. referral_codes/referral_clicks/referral_conversions는
--    관리자 전용 RLS만 있어 회원 본인도 직접 조회할 수 없다 — 대신 이 함수로 본인 범위만 열어준다.
--    total_clicks/total_registrations 컬럼을 그대로 믿지 않고 로그 테이블에서 매번 재집계한다
--    (Bizmobile 관리자 API의 "DB 컬럼 신뢰도 문제 보완" 방식을 그대로 적용).
create or replace function fn_get_my_referral_summary(p_profile_id uuid)
returns table (
  my_code text,
  total_clicks bigint,
  total_registrations bigint,
  total_leads bigint,
  referred_by_code text,
  referred_by_name text,
  network_size bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_code_id uuid;
begin
  if auth.uid() is distinct from p_profile_id
     and not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'insufficient_privilege';
  end if;

  select profiles.my_ref_code_id into v_my_code_id from profiles where profiles.id = p_profile_id;

  return query
  select
    rc.code,
    (select count(*) from referral_clicks where code_id = rc.id),
    (select count(*) from referral_conversions where code_id = rc.id and conversion_type = 'registration'),
    (select count(*) from referral_conversions where code_id = rc.id and conversion_type = 'lead'),
    parent.code,
    parent.name,
    (
      select count(*) from referral_conversions
      where root_code_id = coalesce(rc.root_code_id, rc.id) and conversion_type = 'registration'
    )
  from referral_codes rc
  left join referral_codes parent on parent.id = rc.parent_code_id
  where rc.id = v_my_code_id;
end;
$$;

grant execute on function fn_get_my_referral_summary(uuid) to authenticated;
