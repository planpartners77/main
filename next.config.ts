import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상품/배너/팝업 이미지는 관리자가 입력한 임의의 외부 URL을 그대로 참조하며(호스팅 비용
  // 절감 방침), 출처 도메인을 미리 알 수 없어 remotePatterns 화이트리스트가 불가능하므로
  // 그 값들은 next/image가 아닌 일반 <img>로 렌더링한다(최적화 대상 아님).
  // 로고·정적 콘텐츠 이미지처럼 저장소 안 고정 경로(/public)만 next/image를 사용하므로
  // 전역 unoptimized는 필요 없다 — 켜두면 그 이미지들까지 최적화가 꺼진다.
};

export default nextConfig;
