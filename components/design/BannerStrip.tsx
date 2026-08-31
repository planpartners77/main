import Link from "next/link";
import type { PublicBanner } from "@/lib/design/public-queries";

// 관리자에서 등록한 배너가 없으면 아무것도 렌더링하지 않는다 — §11-3 "빈 화면 노출 금지" 원칙.
export function BannerStrip({ banners }: { banners: PublicBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-3">
      <div className="flex flex-col gap-3">
        {banners.map((banner) => {
          const image = (
            // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션
            <img src={banner.image_url} alt={banner.title} className="w-full rounded-2xl object-cover" />
          );
          return banner.link_url ? (
            <Link key={banner.id} href={banner.link_url} className="block overflow-hidden rounded-2xl">
              {image}
            </Link>
          ) : (
            <div key={banner.id} className="overflow-hidden rounded-2xl">
              {image}
            </div>
          );
        })}
      </div>
    </section>
  );
}
