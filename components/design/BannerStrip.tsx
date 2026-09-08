"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicBanner } from "@/lib/design/public-queries";

const AUTO_SLIDE_MS = 4000;

function BannerSlide({ banner }: { banner: PublicBanner }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 URL, next/image 미사용 컨벤션
    <img src={banner.image_url} alt={banner.title} className="w-full rounded-2xl object-cover" />
  );
  return banner.link_url ? (
    <Link href={banner.link_url} className="block overflow-hidden rounded-2xl">
      {image}
    </Link>
  ) : (
    <div className="overflow-hidden rounded-2xl">{image}</div>
  );
}

// 관리자에서 등록한 배너가 없으면 아무것도 렌더링하지 않는다 — §11-3 "빈 화면 노출 금지" 원칙.
// 배너가 2개 이상이면 가로 슬라이딩(스와이프+자동재생+점 인디케이터)으로, 1개면 정적으로 노출한다.
export function BannerStrip({ banners }: { banners: PublicBanner[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isMultiple = banners.length >= 2;

  useEffect(() => {
    if (!isMultiple) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const nextIndex = (activeIndex + 1) % banners.length;
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: "smooth" });
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [activeIndex, banners.length, isMultiple]);

  if (banners.length === 0) return null;

  if (!isMultiple) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-3">
        <BannerSlide banner={banners[0]} />
      </section>
    );
  }

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-3">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-none snap-center">
            <BannerSlide banner={banner} />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`${index + 1}번째 배너로 이동`}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-5 bg-[var(--brand-blue)]" : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
