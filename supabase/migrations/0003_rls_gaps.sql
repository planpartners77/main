-- 0002_rls.sql은 15개 테이블 중 profiles/leads/consultations/products/audit_logs
-- 5개에만 RLS를 켰다(해당 파일 자체가 "첫 구현 시안, 오픈 전 보안 검토 필요"라고 명시).
-- 나머지 10개는 RLS 미적용 상태였는데, Supabase에서 RLS를 켜지 않은 public 테이블은
-- anon/authenticated 역할에 기본 GRANT가 적용되어 있어 사실상 전체 공개(읽기+쓰기)나
-- 다름없다. 특히 admin_users는 이 상태에서 아무 로그인 사용자나 자기 자신을
-- super_admin으로 insert할 수 있는 심각한 권한상승 경로였다 — 이번 마이그레이션으로 차단한다.

alter table categories enable row level security;
alter table partners enable row level security;
alter table admin_users enable row level security;
alter table customer_tiers enable row level security;
alter table referral_codes enable row level security;
alter table partner_category_terms enable row level security;
alter table referral_clicks enable row level security;
alter table referral_conversions enable row level security;
alter table stores enable row level security;
alter table site_settings enable row level security;

-- categories: 홈/카테고리 퀵내비/신청서(TravelApplyForm의 slug 조회)가 anon 키로
-- 활성 카테고리를 읽어야 하므로 공개 select 허용. 쓰기는 담당 관리자만.
create policy "categories_select_active" on categories
  for select using (is_active = true);
create policy "categories_write_admin" on categories
  for all using (is_admin_for_category(id)) with check (is_admin_for_category(id));

-- partners: settlement_rate/biz_reg_no 등 민감한 정산 정보를 담고 있어 공개 select를
-- 두지 않는다. 현재 코드에서 클라이언트가 이 테이블을 직접 조회하는 곳은 없음.
create policy "partners_admin_only" on partners
  for all using (is_admin_for_category(category_id)) with check (is_admin_for_category(category_id));

-- admin_users: 본인 행만 조회 가능(LoginForm/proxy.ts/session.ts가 auth.uid()로 자기
-- role을 확인하는 용도). insert/update/delete 정책은 의도적으로 두지 않는다 — 관리자
-- 계정 등록/권한 변경은 반드시 서비스 롤 키(대시보드 SQL Editor 등)로만 수행되어야 하며,
-- 로그인한 사용자가 스스로 관리자 권한을 얻거나 바꿀 수 있는 경로를 원천 차단한다.
create policy "admin_users_select_own" on admin_users
  for select using (auth.uid() = id);

-- 아래 테이블들은 아직 어떤 화면/기능도 사용하지 않는 상태(추천인 시스템, 매장 정보,
-- 고객 등급, 운영 설정은 Phase 3+ 예정). 지금 당장 필요한 공개/쓰기 정책이 없으므로
-- RLS만 켜서 기본값(전체 차단)으로 안전하게 잠가둔다 — 실제 기능을 구현할 때 그 시점의
-- 요구사항에 맞는 최소 권한 정책을 추가할 것.
