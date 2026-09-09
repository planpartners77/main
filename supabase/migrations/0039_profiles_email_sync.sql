-- 회원 목록/감사로그/관리자 명단/관리자 추가 화면이 전부 이메일을 보여주거나 검색하려고
-- auth.users를 listUsers({ perPage: 1000 })로 통째로 가져와 메모리에서 매칭하고 있었다.
-- 이 방식은 가입자가 1000명을 넘는 순간부터 뒷 페이지 회원의 이메일이 조용히 "-"로
-- 빠지거나(표시 누락) 이메일 검색에서 아예 매칭되지 않는(검색 누락) 버그가 된다
-- (Admin API 자체에 페이지네이션이 있어 1000명을 넘기면 나머지가 응답에 없기 때문).
--
-- profiles.email 컬럼을 두고 handle_new_user()/신규 트리거로 auth.users와 동기화하면,
-- 회원 수와 무관하게 profiles를 조회하는 기존 쿼리에 이메일이 함께 딸려오고,
-- 검색도 다른 컬럼(display_name/phone)과 동일하게 ilike로 처리할 수 있다.

alter table profiles add column email text;

-- 기존 가입자 백필. auth.users는 이 마이그레이션을 실행하는 postgres 역할에서 조회 가능하다.
update profiles p set email = u.email from auth.users u where u.id = p.id;

create index profiles_email_idx on profiles (email);

-- handle_new_user 확장: 가입 시 email도 함께 채운다. 0033의 로직(추천코드 해석/코드 발급/
-- 카카오 메타데이터)은 그대로 유지하고 insert 컬럼 목록에 email만 추가한다.
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
    id, email, display_name, phone, marketing_opt_in, referred_by_code_id,
    auth_provider, kakao_user_id, gender, birthdate, ci_hash,
    shipping_name, shipping_address, shipping_phone
  )
  values (
    new.id,
    new.email,
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

-- 이메일 변경(비밀번호 찾기/계정 설정 등)에도 profiles.email이 계속 일치하도록 동기화한다.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();
