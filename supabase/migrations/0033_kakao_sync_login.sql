-- 카카오싱크(간편가입) 연동을 위한 스키마 확장.
-- 이메일 대신 카카오 인가코드로 로그인하는 회원을 지원한다 (app/api/auth/kakao/*).
-- 심사 신청 화면(간편가입 동의항목) 기준으로 이름/성별/생일/출생연도/전화번호/CI가 필수,
-- 배송지정보(수령인명/주소/전화번호)는 선택 항목으로 요청한다.

-- 1) profiles: 카카오 관련 컬럼 추가.
--    ci_hash는 원본 CI(연계정보)를 저장하지 않고 SHA-256(CI + pepper) 해시만 저장한다 —
--    카카오 이용약관상 CI의 허용 용도가 "기존 회원과의 동일인 매칭"으로 한정되어 있어,
--    원본을 보관/복호화할 필요 없이 해시 비교만으로 그 목적을 충족할 수 있기 때문이다.
alter table profiles
  add column auth_provider text not null default 'email' check (auth_provider in ('email', 'kakao')),
  add column kakao_user_id text unique,
  add column gender text check (gender in ('male', 'female')),
  add column birthdate date,
  add column ci_hash text,
  add column shipping_name text,
  add column shipping_address text,
  add column shipping_phone text;

create index idx_profiles_kakao_user_id on profiles(kakao_user_id) where kakao_user_id is not null;

-- 2) site_settings: 간편로그인 노출 토글 (관리자 > 간편로그인 관리).
--    구글은 실제 연동 전이라 UI에서만 노출 여부를 관리하고 항상 false로 시딩한다.
insert into site_settings (key, value)
values ('login_methods', '{"kakao": false, "google": false}'::jsonb)
on conflict (key) do nothing;

-- 3) handle_new_user 확장: 카카오 가입 시 메타데이터(auth_provider/kakao_user_id/gender/
--    birthdate/ci_hash/shipping_*)를 profiles에 함께 채운다. 기존 추천코드 발급 로직은
--    그대로 유지한다(0017 마이그레이션 내용 보존).
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
  insert into public.profiles (
    id, display_name, phone, marketing_opt_in, referred_by_code_id,
    auth_provider, kakao_user_id, gender, birthdate, ci_hash,
    shipping_name, shipping_address, shipping_phone
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    v_resolved_id,
    coalesce(new.raw_user_meta_data ->> 'auth_provider', 'email'),
    new.raw_user_meta_data ->> 'kakao_user_id',
    new.raw_user_meta_data ->> 'gender',
    nullif(new.raw_user_meta_data ->> 'birthdate', '')::date,
    new.raw_user_meta_data ->> 'ci_hash',
    new.raw_user_meta_data ->> 'shipping_name',
    new.raw_user_meta_data ->> 'shipping_address',
    new.raw_user_meta_data ->> 'shipping_phone'
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
