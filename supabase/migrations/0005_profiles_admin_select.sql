-- profiles는 profiles_select_own(본인 행만)만 있어, 관리자 대시보드가 전체 회원 수/이번 달
-- 신규가입 같은 집계를 낼 수 없었다(회원 관리 모듈도 앞으로 이 select가 필요). leads의
-- _select_own_or_admin과 동일한 취지로 관리자(admin_users에 행이 있는 계정)에게 select만 추가로 허용한다.
create policy "profiles_select_admin" on profiles
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
