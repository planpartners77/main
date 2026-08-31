-- 마이페이지(§12-10) 구현에 필요한 RLS 보강 2건.

-- 1) settlements는 지금까지 정산 담당자/최고관리자 역할 스코프로만 열려 있어(0010), 고객이
-- 자신의 리드에 연결된 사은품/지원금 지급 현황을 볼 방법이 없었다. leads.user_id로 본인
-- 소유를 확인하는 select 정책을 추가한다(기존 role 스코프 정책과 OR로 합쳐져 공존한다).
create policy "settlements_select_own" on settlements
  for select using (
    exists (
      select 1 from leads
      where leads.id = settlements.lead_id
        and leads.user_id = auth.uid()
    )
  );

-- 2) 회원 관리 화면에서 관리자가 회원 정보를 직접 수정할 수 있게 한다. profiles_select_admin
-- (0005)과 동일하게 블랑켓 admin_users 체크를 쓴다 — 회원 관리는 §9-2 RBAC 매트릭스에 카테고리
-- 스코프 개념이 없는 전역 기능이기 때문이다.
create policy "profiles_update_admin" on profiles
  for update using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
