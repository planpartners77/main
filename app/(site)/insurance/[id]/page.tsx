import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeInsurancePlanExtra } from "@/lib/insurance/plan-spec";
import { ConsultRequestForm } from "@/components/consult/ConsultRequestForm";
import { ProductDetailFallbackNotice } from "@/components/shared/ProductDetailFallbackNotice";
import { sanitizeDetailHtml } from "@/lib/content/sanitize-detail-html";

type InsurancePlanRow = {
  id: string;
  title: string;
  image_url: string | null;
  extra: Record<string, unknown> | null;
  is_active: boolean;
  is_listed: boolean;
  categories: { slug: string } | null;
  partners: { name: string } | null;
};

// generateMetadata와 페이지 본문이 같은 상품을 각각 조회하므로, 한 요청 안에서는
// 한 번만 쿼리하도록 React cache()로 묶는다.
const getRow = cache(async (id: string): Promise<InsurancePlanRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, title, image_url, extra, is_active, is_listed, categories(slug), partners(name)")
    .eq("id", id)
    .maybeSingle();
  const row = data as unknown as InsurancePlanRow | null;
  if (!row || row.categories?.slug !== "insurance" || !row.is_active) return null;
  return row;
});

// 진열 목록에서는 뺐지만 직접 링크로는 열어둔 상품(is_listed=false)은 검색엔진에는
// 노출하지 않는다 — 접근 자체는 계속 허용된다.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const row = await getRow(id);
  if (!row) return {};
  return row.is_listed ? {} : { robots: { index: false, follow: false } };
}

export default async function InsurancePlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getRow(id);

  if (!row) notFound();

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
        {extra.show_detail_html && extra.detail_html ? (
          // 관리자 전용 입력값이지만 저장된 HTML이 그대로 서버 렌더링되므로 sanitize-html로 한 번 걸러낸다.
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeDetailHtml(extra.detail_html) }}
          />
        ) : extra.coverage_summary ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600">
            {extra.coverage_summary}
          </div>
        ) : (
          <ProductDetailFallbackNotice className="" />
        )}
      </div>

      {/* 3단: 상담 신청 폼 */}
      <div id="consult" className="mt-10 scroll-mt-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">상담 신청</h2>
        <div className="mt-4">
          <ConsultRequestForm categorySlug="insurance" categoryName="보험" productId={row.id} productTitle={row.title} />
        </div>
      </div>

      {/* 상세 내용이 길어도 폼으로 바로 갈 수 있는 고정 버튼. 모바일 하단 탭바(약 64px) 위에 띄운다. */}
      <a
        href="#consult"
        className="fixed bottom-20 right-4 z-30 rounded-full bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[var(--brand-blue-dark)] md:bottom-6"
      >
        상담 신청하기
      </a>
    </main>
  );
}
