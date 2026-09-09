-- 카카오/구글 OAuth Client ID·Secret을 .env.local 대신 관리자 화면(/admin/login-methods)에서
-- 직접 입력·수정할 수 있도록 DB 테이블로 옮긴다. 매번 서버 환경변수를 수정하고 재배포해야
-- 했던 기존 방식(0033_kakao_sync_login.sql 당시의 KAKAO_CLIENT_ID/SECRET) 대신, 관리자가
-- 카카오 디벨로퍼스에서 발급받은 키를 그 자리에서 저장하도록 함.
--
-- client_secret은 민감정보이므로 이 테이블에는 site_settings와 달리 공개 select 정책을
-- 두지 않는다(관리자 전용 ALL 정책만 존재 — anon/authenticated 일반 사용자는 select조차 불가).
-- 로그인 미구현 방문자를 상대하는 라우트(app/api/auth/*/start, callback)는 세션이 없으므로
-- RLS를 우회하는 service role 클라이언트(lib/supabase/admin.ts)로 이 테이블을 조회한다.
create table oauth_credentials (
  provider text primary key check (provider in ('kakao', 'google')),
  client_id text,
  client_secret text,
  updated_at timestamptz not null default now()
);

alter table oauth_credentials enable row level security;

create policy "oauth_credentials_admin_all" on oauth_credentials
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

insert into oauth_credentials (provider, client_id, client_secret) values
  ('kakao', null, null),
  ('google', null, null);
