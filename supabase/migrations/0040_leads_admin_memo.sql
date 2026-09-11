-- 관리자 페이지 "신청 내역" 카테고리별 하위메뉴에서 리드를 열람하며 내부 피드백을
-- 남길 수 있도록 leads에 관리자 전용 메모 컬럼을 추가한다. 고객에게는 노출하지 않으므로
-- 별도 RLS 정책 없이 기존 leads update 정책(is_admin_for_category)을 그대로 사용한다.
alter table leads add column admin_memo text;
