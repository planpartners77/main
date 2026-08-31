-- 회원 관리 화면에서 profiles.tier_id를 customer_tiers(name)로 조인해 등급명을 보여주려면
-- customer_tiers에 최소 select 정책이 필요하다(0003_rls_gaps.sql에서 RLS만 켜고 미사용
-- 테이블이라 정책 없이 전체 차단 상태였음). 관리자 전용으로만 연다 — 고객이 직접 등급
-- 테이블을 조회할 화면(/mypage 등)은 아직 없으므로 그 요구가 생기면 그때 추가한다.
create policy "customer_tiers_select_admin" on customer_tiers
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
