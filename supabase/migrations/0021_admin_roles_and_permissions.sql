-- 관리자 등급을 5종에서 10종으로 확장한다. 기존 5종(super_admin/category_manager/cs_agent/
-- settlement_manager/content_manager)의 문자열 값은 그대로 유지하고(기존 admin_users 행이
-- 깨지지 않도록), 아래 5종을 새로 추가한다:
--   member_manager(회원 담당), product_manager(상품 담당), marketing_manager(마케팅 담당),
--   operations_manager(운영 담당), viewer(조회 전용)
-- 등급별 메뉴 접근 범위는 코드(lib/admin/permissions.ts)에서 관리하며, is_admin_for_category
-- (0002_rls.sql)의 super_admin 우회 로직은 값이 그대로 남아있으므로 영향 없다.
alter table admin_users drop constraint if exists admin_users_role_check;
alter table admin_users add constraint admin_users_role_check check (
  role in (
    'super_admin',
    'category_manager',
    'cs_agent',
    'settlement_manager',
    'content_manager',
    'member_manager',
    'product_manager',
    'marketing_manager',
    'operations_manager',
    'viewer'
  )
);
