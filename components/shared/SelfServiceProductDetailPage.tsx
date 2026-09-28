import Link from "next/link";
import { notFound } from "next/navigation";
import { getSelfServiceProductDetail } from "@/lib/products/self-service-detail-query";
import { ApplyButton } from "@/components/shared/ApplyButton";
import { ProductDetailFallbackNotice } from "@/components/shared/ProductDetailFallbackNotice";
import { sanitizeDetailHtml } from "@/lib/content/sanitize-detail-html";

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

// 전용 스펙 UI가 없는 셀프서비스형 카테고리(인터넷·가전렌탈 등)의 상세 페이지가 공유하는 화면.
export async function SelfServiceProductDetailPage({
  categorySlug,
  listHref,
  id,
}: {
  categorySlug: string;
  listHref: string;
  id: string;
}) {
  const item = await getSelfServiceProductDetail(categorySlug, id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-36 pt-10 sm:pb-10">
      <Link href={listHref} className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 목록으로
      </Link>

      {item.partner_name && <p className="mt-4 text-xs text-gray-400">{item.partner_name}</p>}
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">{item.title}</h1>

      {item.base_price != null && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-2xl font-bold text-[var(--brand-navy)]">{formatWon(item.base_price)}</p>
        </div>
      )}

      {item.show_detail_html && item.detail_html ? (
        // 관리자 전용 입력값이지만 저장된 HTML이 그대로 서버 렌더링되므로 sanitize-html로 한 번 걸러낸다.
        <div
          className="prose prose-sm mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeDetailHtml(item.detail_html) }}
        />
      ) : (
        <ProductDetailFallbackNotice />
      )}

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-gray-100 bg-white p-4 sm:static sm:bottom-auto sm:z-auto sm:mt-10 sm:border-0 sm:p-0">
        <ApplyButton
          categorySlug={categorySlug}
          productId={item.id}
          applyUrl={item.apply_url}
          internalHref={`/apply/${categorySlug}?planId=${item.id}`}
          className="block w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-center text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-[var(--brand-blue-dark)]"
        />
      </div>
    </main>
  );
}
