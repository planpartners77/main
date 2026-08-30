import { Hero } from "@/components/home/Hero";
import { CategoryQuickNav } from "@/components/home/CategoryQuickNav";
import { IncentiveBanner } from "@/components/home/IncentiveBanner";
import { TrustPoints } from "@/components/home/TrustPoints";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { PopularProducts } from "@/components/home/PopularProducts";
import { WhyPossible } from "@/components/home/WhyPossible";
import { BottomCta } from "@/components/home/BottomCta";

// 아정당(ajd.co.kr) 랜딩 페이지의 섹션 구성을 참고해 레이아웃을 구성하되, 문구/색상/수치는
// 플랜파트너스 고유의 것으로 새로 작성했다(§12-3).
export default function Home() {
  return (
    <>
      <Hero />
      <CategoryQuickNav />
      <IncentiveBanner />
      <TrustPoints />
      <ReviewsSection />
      <PopularProducts />
      <WhyPossible />
      <BottomCta />
    </>
  );
}
