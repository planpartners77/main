-- 휴대폰 요금제의 "n명 선택" 수치를 관리자가 손으로 입력하지 않고 leads 테이블의
-- 실제 신청 건수에서 집계하기 위한 함수. leads는 RLS로 일반 사용자가 행 단위 조회를
-- 할 수 없으므로(leads_select_own_or_admin), 상품별 집계 건수만 반환하는
-- security definer 함수를 통해 공개 페이지에서 안전하게 노출한다.
create or replace function public.mobile_plan_lead_counts()
returns table (product_id uuid, lead_count bigint)
language sql
security definer
set search_path = public
as $$
  select l.product_id, count(*)::bigint as lead_count
  from leads l
  join products p on p.id = l.product_id
  join categories c on c.id = p.category_id
  where c.slug = 'mobile' and l.product_id is not null
  group by l.product_id;
$$;

grant execute on function public.mobile_plan_lead_counts() to anon, authenticated;
