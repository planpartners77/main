-- 팝업 관리(PopupManager) "노출 대상"을 단일 카테고리 선택에서 다중 선택 + 포함/제외 모드로 확장한다.
-- 기존 category_id(단일 FK)는 "전체(카테고리 미매칭 페이지 전체)"와 "특정 카테고리 1개"만 표현 가능해서
-- 여러 페이지를 동시에 지정하거나, 반대로 특정 페이지만 제외하는 요구를 처리할 수 없었다.
-- category_ids는 uuid FK 배열이 아니라 text[]로 둔다 — "메인페이지"를 가리키는 카테고리 로우가
-- 실제로는 없어서(홈은 카테고리 트리 밖) 'home'이라는 고정 문자열을 함께 담을 수 있어야 하기 때문.
-- 겸사겸사 스케일업 제안이었던 기기별/로그인상태별 타겟팅도 같은 김에 컬럼만 추가해둔다.
alter table popups add column target_mode text not null default 'all'
  check (target_mode in ('all', 'include', 'exclude'));
alter table popups add column category_ids text[] not null default '{}';
alter table popups add column device_target text not null default 'all'
  check (device_target in ('all', 'mobile', 'desktop'));
alter table popups add column login_target text not null default 'all'
  check (login_target in ('all', 'guest', 'member'));

-- 기존 category_id 값을 새 컬럼으로 옮긴다: null이면 전체 노출 유지, 값이 있으면 그 카테고리만
-- 포함하는 include 모드로 전환 — 기존 노출 범위가 그대로 보존되도록.
update popups
set target_mode = 'include',
    category_ids = array[category_id::text]
where category_id is not null;

alter table popups drop column category_id;
