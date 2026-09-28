import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLandingPageDetail } from "@/lib/landing/pages-query";
import { LandingLeadForm } from "@/components/landing/LandingLeadForm";
import { InsuranceConsultForm } from "@/components/landing/InsuranceConsultForm";
import { ProductDetailFallbackNotice } from "@/components/shared/ProductDetailFallbackNotice";
import { sanitizeDetailHtml } from "@/lib/content/sanitize-detail-html";

// 진열 목록에서는 뺐지만 직접 링크로는 열어둔 상품(is_listed=false)은 검색엔진에는
// 노출하지 않는다 — 접근 자체는 계속 허용된다.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getLandingPageDetail(id);
  if (!item) return {};
  return item.is_listed ? {} : { robots: { index: false, follow: false } };
}

export default async function LandingPageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getLandingPageDetail(id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/lp" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 목록으로
      </Link>

      {item.extra.show_detail_html && item.extra.detail_html ? (
        // 관리자 전용 입력값이지만 저장된 HTML이 그대로 서버 렌더링되므로 sanitize-html로 한 번 걸러낸다.
        <div
          className="prose prose-sm mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeDetailHtml(item.extra.detail_html) }}
        />
      ) : (
        <ProductDetailFallbackNotice />
      )}

      <div className="mt-10">
        {item.extra.form_type === "insurance_consult" ? (
          <InsuranceConsultForm productId={item.id} />
        ) : (
          <LandingLeadForm productId={item.id} productTitle={item.title} leadForm={item.extra.lead_form} />
        )}
      </div>
    </main>
  );
}
