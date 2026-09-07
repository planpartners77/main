-- "휴대폰(mobile)" 카테고리를 "유심(usim)"으로 명칭 정정한다.
-- 오늘까지의 작업은 실제로는 유심 카테고리였고, "휴대폰"은 내일부터 별도로
-- 새로 만들 카테고리이므로 슬러그/이름을 삭제가 아닌 정정(rename)으로 처리한다.
update categories set slug = 'usim', name = '유심' where slug = 'mobile';

-- 0026_mobile_lead_counts.sql에서 만든 함수를 슬러그 변경에 맞춰 완전히 재생성한다.
drop function if exists public.mobile_plan_lead_counts();

create or replace function public.usim_plan_lead_counts()
returns table (product_id uuid, lead_count bigint)
language sql
security definer
set search_path = public
as $$
  select l.product_id, count(*)::bigint as lead_count
  from leads l
  join products p on p.id = l.product_id
  join categories c on c.id = p.category_id
  where c.slug = 'usim' and l.product_id is not null
  group by l.product_id;
$$;

grant execute on function public.usim_plan_lead_counts() to anon, authenticated;

-- 관리자가 홈페이지 문구를 커스터마이즈해 site_settings에 저장해둔 경우에도
-- 마케팅 문구의 "휴대폰"을 "유심"으로 함께 정정한다.
update site_settings
set value = jsonb_set(value, '{heroSubcopy}', to_jsonb(replace(value->>'heroSubcopy', '휴대폰', '유심')))
where key = 'home_page'
  and value ? 'heroSubcopy'
  and value->>'heroSubcopy' like '%휴대폰%';
