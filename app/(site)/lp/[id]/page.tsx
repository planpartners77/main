import Link from "next/link";
import { notFound } from "next/navigation";
import { getLandingPageDetail } from "@/lib/landing/pages-query";
import { LandingLeadForm } from "@/components/landing/LandingLeadForm";

export default async function LandingPageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getLandingPageDetail(id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/lp" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 목록으로
      </Link>

      {item.extra.detail_html ? (
        // 관리자만 입력 가능한 상세페이지 HTML. CustomHeadScript와 동일한 신뢰 수준으로
        // sanitize 없이 원본 그대로 렌더링한다(사용자 입력이 아닌 관리자 전용 입력값).
        <div className="mt-6" dangerouslySetInnerHTML={{ __html: item.extra.detail_html }} />
      ) : (
        <p className="mt-6 text-sm text-gray-400">등록된 상세 콘텐츠가 없습니다.</p>
      )}

      <div className="mt-10">
        <LandingLeadForm productId={item.id} productTitle={item.title} />
      </div>
    </main>
  );
}
