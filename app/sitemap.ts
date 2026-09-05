import type { MetadataRoute } from "next";
import type { SubCategoryConfig } from "@/lib/categories";
import { getCategoryTree } from "@/lib/design/category-tree";
import { getSeoSettings } from "@/lib/design/site-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://planpartner.co.kr";

// 카테고리 화면과 무관한 정적 페이지. 로그인/마이페이지/비밀번호재설정 등 개인화·인증
// 페이지는 검색엔진에 노출할 가치가 없어 제외한다.
const STATIC_PATHS = [
  "/",
  "/company",
  "/notices",
  "/stores",
  "/events",
  "/legal/privacy",
  "/legal/terms",
  "/legal/marketing-consent",
  "/legal/email-collection-refusal",
];

// 하위카테고리는 2단계 이상 중첩될 수 있어(§travel > edu > english-camp) 재귀적으로 모든
// href를 모은다.
function collectHrefs(nodes: SubCategoryConfig[] | undefined, acc: Set<string>) {
  for (const node of nodes ?? []) {
    acc.add(node.href);
    collectHrefs(node.subcategories, acc);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoSettings();
  if (!seo.indexable) return [];

  const categories = await getCategoryTree();
  const paths = new Set<string>(STATIC_PATHS);

  for (const category of categories) {
    paths.add(`/${category.slug}`);
    paths.add(`/compare/${category.slug}`);
    paths.add(
      category.trackType === "consult_required"
        ? `/consult/${category.slug}`
        : `/apply/${category.slug}`
    );
    if (category.trackType === "self_service") {
      paths.add(`/quiz/${category.slug}`);
    }
    collectHrefs(category.subcategories, paths);
  }

  const now = new Date();
  return Array.from(paths).map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
