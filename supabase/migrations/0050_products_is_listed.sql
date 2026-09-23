-- 상품관리 §진열 제어: is_active는 RLS(products_select_active)가 참조하는 "완전 공개 여부"
-- 게이트라서 false면 직접 링크로도 접근이 막힌다. "진열에서만 빼고 직접 링크는 열어두고
-- 싶다"는 요청을 위해 진열 목록 전용 컬럼을 별도로 둔다. 상세페이지/신청폼 쿼리는 계속
-- is_active만 확인하므로 is_listed=false여도 링크로는 그대로 접근된다.
-- 기본값 true로 두어 기존 상품은 전부 지금처럼 진열되는 것으로 시작한다(동작 변화 없음).
alter table products
  add column if not exists is_listed boolean not null default true;
