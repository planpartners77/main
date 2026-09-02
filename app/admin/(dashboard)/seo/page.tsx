import Link from "next/link";
import { getSeoSettings } from "@/lib/design/site-settings";
import { SeoSettingsManager } from "@/components/admin/seo/SeoSettingsManager";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://planpartners77.vercel.app";

function GuideStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{title}</p>
      <div className="mt-1.5 space-y-1.5 text-sm text-gray-600">{children}</div>
    </li>
  );
}

export default async function AdminSeoPage() {
  const settings = await getSeoSettings();

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">SEO 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        구글·네이버 검색에 사이트가 노출되도록 기술적인 설정을 관리합니다. sitemap.xml과
        robots.txt는 카테고리 오픈 현황에 맞춰 자동으로 갱신됩니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <a
          href="/robots.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-gray-200 px-3 py-1.5 font-medium text-[var(--brand-blue)] hover:border-[var(--brand-blue)]/50"
        >
          robots.txt 보기 ↗
        </a>
        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-gray-200 px-3 py-1.5 font-medium text-[var(--brand-blue)] hover:border-[var(--brand-blue)]/50"
        >
          sitemap.xml 보기 ↗
        </a>
      </div>

      <h2 className="mt-8 text-sm font-bold text-[var(--brand-navy)]">1. 사이트 소유확인 및 설정</h2>
      <div className="mt-3">
        <SeoSettingsManager settings={settings} />
      </div>

      <h2 className="mt-10 text-sm font-bold text-[var(--brand-navy)]">2. 실제 노출을 위한 행동 지침</h2>
      <p className="mt-1 text-sm text-gray-500">
        아래 순서대로 진행하면 구글·네이버 검색결과에 사이트가 등록됩니다. 코드 작업은 이미
        완료되어 있으니, 아래는 각 검색엔진의 웹사이트(Search Console, 서치어드바이저)에서
        직접 진행하시면 됩니다.
      </p>

      <p className="mt-6 text-sm font-bold text-[var(--brand-blue)]">📍 구글 (Google Search Console)</p>
      <ol className="mt-3 space-y-3">
        <GuideStep title="① 속성 등록">
          <p>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              search.google.com/search-console
            </a>
            에 구글 계정으로 로그인 후, &quot;URL 접두어&quot; 방식으로 사이트 주소({siteUrl})를
            입력해 속성을 추가합니다.
          </p>
        </GuideStep>
        <GuideStep title="② 소유권 확인 (HTML 태그 방식)">
          <p>
            소유권 확인 방법 중 &quot;HTML 태그&quot;를 선택하면 <code>&lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot;&gt;</code>
            형태의 코드가 표시됩니다. 이 중 content=&quot;&quot; 안쪽 값만 복사해서 위 &quot;구글
            사이트 소유확인 코드&quot; 입력란에 붙여넣고 저장하세요.
          </p>
          <p>저장 후 몇 분 내로 사이트에 반영되므로, 잠시 기다렸다가 Search Console에서 &quot;확인&quot; 버튼을 누르세요.</p>
        </GuideStep>
        <GuideStep title="③ 사이트맵 제출">
          <p>
            Search Console 좌측 메뉴 &quot;Sitemaps&quot;에서 <code>sitemap.xml</code>을 입력하고
            제출합니다. (전체 주소: {siteUrl}/sitemap.xml)
          </p>
        </GuideStep>
        <GuideStep title="④ 색인 생성 요청 (선택, 빠른 노출용)">
          <p>
            상단 검색창에 주요 페이지 주소(예: {siteUrl}/travel)를 붙여넣고 &quot;URL 검사&quot; →
            &quot;색인 생성 요청&quot;을 누르면 해당 페이지가 더 빨리 검색에 반영됩니다. 신규
            페이지가 생길 때마다 반복하면 좋습니다.
          </p>
        </GuideStep>
      </ol>

      <p className="mt-6 text-sm font-bold text-[var(--brand-blue)]">📍 네이버 (네이버 서치어드바이저)</p>
      <ol className="mt-3 space-y-3">
        <GuideStep title="① 사이트 등록">
          <p>
            <a
              href="https://searchadvisor.naver.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              searchadvisor.naver.com
            </a>
            에 네이버 계정으로 로그인 후, &quot;웹마스터 도구&quot;에서 사이트 주소({siteUrl})를
            등록합니다.
          </p>
        </GuideStep>
        <GuideStep title="② 소유확인 (HTML 태그 방식)">
          <p>
            소유확인 방법에서 &quot;HTML 태그&quot;를 선택하면 <code>&lt;meta name=&quot;naver-site-verification&quot; content=&quot;...&quot;&gt;</code>
            코드가 표시됩니다. content=&quot;&quot; 안쪽 값만 복사해서 위 &quot;네이버 사이트
            소유확인 코드&quot; 입력란에 붙여넣고 저장한 뒤, 잠시 기다렸다가 &quot;소유확인&quot;을
            누르세요.
          </p>
        </GuideStep>
        <GuideStep title="③ 사이트맵 제출">
          <p>
            등록된 사이트의 &quot;요청 &gt; 사이트맵 제출&quot; 메뉴에서 <code>sitemap.xml</code>을
            제출합니다. (전체 주소: {siteUrl}/sitemap.xml)
          </p>
        </GuideStep>
        <GuideStep title="④ 웹페이지 수집 요청 (선택, 빠른 노출용)">
          <p>
            &quot;요청 &gt; 웹페이지 수집&quot; 메뉴에서 주요 페이지 주소를 직접 입력해 수집을
            요청하면 더 빠르게 검색에 반영됩니다. (하루 요청 가능 횟수 제한이 있습니다.)
          </p>
        </GuideStep>
      </ol>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">참고</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>등록 직후에는 검색결과에 바로 나타나지 않으며, 보통 며칠~몇 주가 걸립니다.</li>
          <li>
            새 카테고리를 오픈하면(관리자 &gt; 카테고리 관리에서 활성화) sitemap.xml에 자동으로
            추가되므로, 별도 작업 없이 위 ④ 색인/수집 요청만 다시 해주면 됩니다.
          </li>
          <li>
            위 &quot;검색엔진 노출 허용&quot; 체크를 끄면 robots.txt가 전체 차단으로 바뀌어 이미
            등록한 내용도 검색에서 제외되니, 실제 운영 중에는 반드시 켜둔 상태를 유지하세요.
          </li>
        </ul>
      </div>
    </div>
  );
}
