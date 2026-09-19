import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeInsurancePlanExtra } from "@/lib/insurance/plan-spec";
import { ConsultRequestForm } from "@/components/consult/ConsultRequestForm";

export default async function InsurancePlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, title, image_url, extra, is_active, categories(slug), partners(name)")
    .eq("id", id)
    .maybeSingle();

  const row = data as unknown as {
    id: string;
    title: string;
    image_url: string | null;
    extra: Record<string, unknown> | null;
    is_active: boolean;
    categories: { slug: string } | null;
    partners: { name: string } | null;
  } | null;

  if (!row || row.categories?.slug !== "insurance" || !row.is_active) notFound();

  const extra = normalizeInsurancePlanExtra(row.extra);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
      <Link href="/insurance" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 목록으로
      </Link>

      {/* 1단: 대표 이미지 */}
      <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-50">
        {row.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션
          <img src={row.image_url} alt={row.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-300">이미지 준비중</div>
        )}
      </div>

      <h1 className="mt-5 text-2xl font-bold text-[var(--brand-navy)]">{row.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {row.partners?.name ?? extra.insurer ?? "제휴사"}
        {extra.monthly_premium && ` · ${extra.monthly_premium}`}
      </p>

      {/* 2단: 상세 콘텐츠 */}
      <div className="mt-8">
        {extra.detail_html ? (
          // 관리자만 입력 가능한 상세페이지 HTML. LandingPageDetailPage와 동일한 신뢰 수준으로
          // sanitize 없이 원본 그대로 렌더링한다(사용자 입력이 아닌 관리자 전용 입력값).
          <div dangerouslySetInnerHTML={{ __html: extra.detail_html }} />
        ) : extra.coverage_summary ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600">
            {extra.coverage_summary}
          </div>
        ) : null}
      </div>

      {/* 3단: 상담 신청 폼 */}
      <div id="consult" className="mt-10 scroll-mt-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">상담 신청</h2>
        <div className="mt-4">
          <ConsultRequestForm categorySlug="insurance" categoryName="보험" productId={row.id} productTitle={row.title} />
        </div>
      </div>
    </main>
  );
}
