-- 상품별로 "신청하기"를 외부 URL로 연결할 수 있도록 하는 선택 필드.
-- 값이 없으면 기존처럼 사이트 내 신청폼(leads)으로 연결된다.
alter table products add column apply_url text;
