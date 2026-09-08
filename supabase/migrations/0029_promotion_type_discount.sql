-- plan_promotions.type에 "추가 요금할인(discount)" 지급 유형을 추가한다.
-- 기존에는 fixed(현금 페이백)/point(포인트 지급) 두 가지만 CHECK 제약으로 허용했다.
alter table plan_promotions drop constraint if exists plan_promotions_type_check;
alter table plan_promotions add constraint plan_promotions_type_check
  check (type = any (array['fixed'::text, 'point'::text, 'discount'::text]));
