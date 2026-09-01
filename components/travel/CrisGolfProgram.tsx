import Link from "next/link";

// 파트너사 "여기캠프(나무투어)"가 제공하는 CRIS(태국 치앙라이) 국제학교 골프 체험 프로그램.
// 원본 자료(참고자료들/여기캠프 인 치앙라이.html)의 골드/네이비 커스텀 디자인은 배제하고
// PlanPartners 공통 블루 컨셉 톤으로 재구성. 문의 CTA는 파트너 직통 연락처 대신
// PlanPartners 자체 신청 플로우(/apply/travel)로 연결(§중개 플랫폼 원칙).
const CURRICULUM = [
  { src: "/travel/curric-eld.jpg", label: "English Language\nDevelopment (ELD)" },
  { src: "/travel/curric-preschool.jpg", label: "Preschool" },
  { src: "/travel/curric-elementary.jpg", label: "Elementary" },
  { src: "/travel/curric-middle.jpg", label: "Middle School" },
  { src: "/travel/curric-high.jpg", label: "High School" },
];

const CLASSROOMS = [
  { src: "/travel/classroom-kindergarten.jpg", label: "Kindergarten" },
  { src: "/travel/classroom-primary.jpg", label: "Primary Classroom" },
  { src: "/travel/classroom-science.jpg", label: "Science Lab" },
];

const FACILITIES = [
  { src: "/travel/facility-canteen.jpg", label: "Canteen" },
  { src: "/travel/facility-football.jpg", label: "Football Field" },
  { src: "/travel/facility-pool.jpg", label: "Swimming Pool" },
  { src: "/travel/facility-basketball.jpg", label: "Basketball Court" },
  { src: "/travel/facility-playground.jpg", label: "Playground" },
  { src: "/travel/facility-library.jpg", label: "Library" },
  { src: "/travel/facility-dormitory.jpg", label: "Dormitory" },
  { src: "/travel/facility-livingroom.jpg", label: "Living Room" },
  { src: "/travel/facility-dormitory-exterior.jpg", label: "Dormitory Exterior" },
];

const BENEFITS = [
  { icon: "🛏️", title: "숙박 제공", desc: "콘도형 기숙사 숙박" },
  { icon: "🍽️", title: "식사 제공", desc: "건강하고 균형 잡힌 식사" },
  { icon: "📖", title: "영어 수업", desc: "원어민 교사와 함께하는 수업 (보호자 제외)" },
  { icon: "⛳", title: "골프 레슨", desc: "PGA 프로의 전문 레슨 (보호자 제외)" },
  { icon: "🏌️", title: "그린피 포함", desc: "해피시티 골프장 라운딩" },
];

const COST_INCLUDED = [
  "콘도형 리조트 숙박",
  "식사 제공",
  "원어민 영어수업 (보호자 제외)",
  "PGA 골프레슨 (보호자 제외)",
  "골프장 그린피",
];

const COST_SELF_PAY = [
  { title: "왕복 항공료", desc: "참가자 개별 부담" },
  { title: "입학 신청비 30만원", desc: "보호자는 신청비 없음 · 성수기 추가비용은 신청 상세 참조" },
  { title: "캐디피 · 캐디팁", desc: "650바트(약 3만원), 학생 라운딩 시 현지 지불" },
  { title: "보호자 1:1 골프 레슨", desc: "1,500바트(약 65,000원), 보호자만 해당" },
];

const ESSENTIALS = ["골프장갑", "운동화"];

const ETC_NOTES = [
  "골프텔(콘도) 내에서 환전 가능 — 센트럴 백화점 환전소가 환율 우대",
  "식사 시간: 조식 6시~8시 · 중식 11:30~13:30 · 석식 17:30~19:00",
  "수영장 이용 시 비치타올은 제공되지 않으며 콘도 비치 타올을 사용",
  "학생 라운딩 시 캐디피·캐디팁(650바트)은 현지에서 별도 지불 — 주 1회(금요일), 라운딩 가능자에 한함 (초보자 제외)",
  "정규 수업 중 태국어 수업은 한국의 국어 수업에 해당하며 전원 함께 참여",
];

const APPLY_INFO = [
  { k: "신청 기간", v: "현재 ~ 11월 말" },
  { k: "참가 대상", v: "초등 4학년 ~ 고등 2학년" },
  { k: "진행 장소", v: "CRIS · 해피시티 골프&리조트 (태국 치앙라이)" },
  { k: "지원 항목", v: "숙박·식사·영어수업·골프레슨·그린피 (영어수업·골프레슨은 보호자 제외)" },
  { k: "별도 부담", v: "입학금 30만원(성수기 추가)·항공료·캐디피/캐디팁·보호자 1:1 레슨" },
  { k: "신청 접수", v: "파트너사 여기캠프" },
];

function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">{title}</h2>
      {desc && <p className="mt-2 text-sm text-gray-500">{desc}</p>}
    </div>
  );
}

function ImageGrid({
  items,
  cols = "grid-cols-2 sm:grid-cols-3",
  imgHeight = "h-32",
}: {
  items: { src: string; label: string }[];
  cols?: string;
  imgHeight?: string;
}) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {items.map((item) => (
        <div key={item.src} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* 임시 원본 사진 — 정식 계약/에셋 확보 후 image_url(외부 URL)로 교체 예정 */}
          <img src={item.src} alt={item.label} className={`w-full ${imgHeight} object-cover`} loading="lazy" />
          <div className="whitespace-pre-line bg-[var(--brand-navy)] px-2 py-2.5 text-center text-xs font-semibold leading-snug text-white">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CrisGolfProgram() {
  return (
    <main className="pb-16">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--brand-mint)] to-[var(--brand-blue)]" />
        <div className="mx-auto max-w-5xl px-4 pt-10">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">여행 · 유학 체험 프로그램</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug text-[var(--brand-navy)] sm:text-3xl">
            국제학교 골프유학,
            <br />
            1주일간의 <span className="text-[var(--brand-urgent)]">무료 체험</span> 초대장
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-500">
            골프·영어·기숙사 생활을 실제로 체험하는 1주 프로그램. 미국 대학 진학을 준비하는
            국제학교의 커리큘럼과 훈련 환경을 파트너사 &quot;여기캠프&quot;가 안내합니다.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl">
            <img
              src="/travel/hero.jpg"
              alt="치앙라이 국제학교 골프 프로그램"
              className="h-56 w-full object-cover sm:h-80"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["골프 · 영어 · 기숙사 체험", "초4 ~ 고2 대상", "학부모 동반 가능"].map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-[var(--brand-navy)]"
              >
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-[var(--surface-tint)] p-5">
            <p className="text-sm font-bold text-[var(--brand-navy)]">
              숙박·식사·수업·레슨·그린피 전액 지원
            </p>
            <p className="mt-1 text-sm text-gray-600">
              입학금(신청비) 30만원 + 캐디피 등 일부 비용은 본인 부담 (자세히 보기 ↓)
            </p>
          </div>

          <Link
            href="/apply/travel"
            className="mt-6 inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)]"
          >
            신청하기
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHead
          eyebrow="PROGRAM"
          title="학업과 골프, 두 가지를 동시에 확인하는 1주"
          desc={`등록 전에 국제학교 생활을 미리 겪어보는 체험 프로그램입니다. "여기캠프"가 CRIS 국제학교 골프 프로그램의 한국 파트너로서 신청부터 출국까지 안내를 도와드립니다.`}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--brand-navy)]">🎓 프로그램 소개</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              골프 국제학교 입학을 고려하는 학생을 위한 프로그램입니다. 태국 치앙라이의
              CRIS(Chiang Rai International School)에서 실제 수업, 기숙사 생활, PGA 프로 골프
              훈련을 1주간 그대로 체험합니다. 캘리포니아 학제 기반 커리큘럼과 영어 몰입
              환경에서 진학 가능성을 직접 가늠해볼 수 있습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--brand-navy)]">👥 참가 대상</h3>
            <ul className="mt-3 space-y-2.5">
              {[
                "초등학교 4학년 ~ 고등학교 2학년",
                "골프 국제학교 진학을 고려 중인 학생",
                "학부모 동반 참가 가능",
                "영어 실력 무관, 몰입 환경 체험 목적 참가 가능",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[var(--brand-navy)] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-xs font-bold tracking-wider text-[var(--brand-mint)]">BENEFITS</p>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            1주 체험, 이렇게 전액 지원됩니다
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-white/15 bg-white/5 p-4 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
                  {b.icon}
                </div>
                <p className="mt-3 text-sm font-bold text-white">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand-mint)]/40 bg-[var(--brand-mint)]/10 p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <div>
                <p className="text-sm font-bold text-white">
                  항공료·입학금 등 일부 항목만 본인 부담, 나머지는 전액 지원
                </p>
                <p className="mt-1 text-xs text-white/70">
                  숙박·식사·영어수업·골프레슨·그린피 포함 (캐디피·팁 약 3만원, 보호자 1:1 골프레슨은
                  개별 부담)
                </p>
              </div>
            </div>
            <p className="text-xs text-white/50">자세한 비용은 아래 COST 안내 참고</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHead
          eyebrow="COST"
          title="비용 안내"
          desc="숙박부터 레슨까지 대부분 무료로 지원되며, 아래 항목만 별도로 부담하시면 됩니다."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--brand-mint)]/30 bg-[var(--brand-mint)]/5 p-6">
            <h3 className="text-sm font-bold text-[var(--brand-navy)]">✅ 무료 지원 (보호자 포함 제공)</h3>
            <ul className="mt-3 space-y-2.5">
              {COST_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-mint)] text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--brand-urgent)]/20 bg-[var(--brand-urgent)]/5 p-6">
            <h3 className="text-sm font-bold text-[var(--brand-navy)]">💳 본인 부담 항목</h3>
            <ul className="mt-3 space-y-3">
              {COST_SELF_PAY.map((item) => (
                <li key={item.title} className="text-sm">
                  <p className="font-semibold text-[var(--brand-navy)]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHead eyebrow="GUIDE" title="준비물 및 생활 안내" desc="출국 전 꼭 확인해 주세요." />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--brand-navy)]">🎒 필수 준비물</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {ESSENTIALS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[var(--surface-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-navy)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--brand-navy)]">ℹ️ 기타 안내</h3>
              <ul className="mt-3 space-y-2.5">
                {ETC_NOTES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHead
          eyebrow="SCHEDULE"
          title="1주 체험 프로그램 일정"
          desc="학교 사정에 따라 세부 일정은 변경될 수 있습니다. (토요일 도착 ~ 다음 토요일 퇴소, 8일)"
        />
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-center text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--brand-navy)] text-white">
                  <th className="p-3"></th>
                  <th className="p-3">토(도착)</th>
                  <th className="p-3">일</th>
                  <th className="p-3">월</th>
                  <th className="p-3">화</th>
                  <th className="p-3">수</th>
                  <th className="p-3">목</th>
                  <th className="p-3">금</th>
                  <th className="p-3">토(퇴소)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">6시–8시</td>
                  <td className="border-r border-gray-100 bg-[var(--surface-tint)] p-3 font-semibold text-[var(--brand-navy)]" rowSpan={7}>
                    치앙마이 도착
                    <br />
                    치앙라이 이동
                  </td>
                  <td className="border-r border-gray-100 bg-[var(--surface-tint)] p-3 font-semibold text-[var(--brand-navy)]" rowSpan={7}>
                    오리엔테이션
                  </td>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    조식 및 등교
                  </td>
                  <td className="p-3 text-gray-600" rowSpan={2}>
                    짐정리 및 체크아웃
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">8시–12시</td>
                  <td className="p-3 text-gray-600">수업</td>
                  <td className="p-3 text-gray-600">수업</td>
                  <td className="p-3 text-gray-600">수업</td>
                  <td className="p-3 text-gray-600">수업</td>
                  <td className="p-3 text-gray-600">수업</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">11:30–13:30</td>
                  <td className="bg-[var(--surface-tint-strong)] p-3 font-semibold text-[var(--brand-navy)]" colSpan={5}>
                    점심 식사
                  </td>
                  <td className="border-l border-gray-100 bg-[var(--surface-tint)] p-3 font-semibold text-[var(--brand-navy)]" rowSpan={5}>
                    치앙마이
                    <br />
                    이동
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">13:30–15시</td>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    골프 레슨 및 라운딩
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">15시–17:30</td>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    자유 수영
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">17:30–19시</td>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    저녁식사 및 휴식
                  </td>
                </tr>
                <tr>
                  <td className="bg-[var(--brand-mint)]/20 p-3 font-semibold text-[var(--brand-navy)]">19시</td>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    일과 종료
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-[var(--surface-tint)] p-3 text-center text-xs text-gray-500">
            ※ 정규 주간 일과표이며, 1주 체험 프로그램은 도착일 기준으로 조정되어 적용됩니다. 캐디피·수영장
            타올 등 세부 안내는 위 준비물 및 생활 안내를 참고해 주세요.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHead
          eyebrow="CAMPUS"
          title="교육과정"
          desc="유치원부터 고등과정까지, 실제 재학생들이 생활하는 캠퍼스와 커리큘럼입니다."
        />
        <div className="mb-4 overflow-hidden rounded-2xl shadow-sm">
          <img
            src="/travel/campus-cover.jpg"
            alt="CRIS 캠퍼스 전경"
            className="h-56 w-full object-cover sm:h-72"
          />
        </div>
        <ImageGrid items={CURRICULUM} cols="grid-cols-2 sm:grid-cols-5" />
      </section>

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHead eyebrow="FACILITIES" title="학교시설" desc="CRIS의 교실과 캠퍼스 시설을 살펴보세요." />
          <p className="mb-3 text-xs font-bold tracking-wider text-[var(--brand-navy)]">CLASSROOM</p>
          <ImageGrid items={CLASSROOMS} imgHeight="h-40" />
          <p className="mb-3 mt-8 text-xs font-bold tracking-wider text-[var(--brand-navy)]">FACILITIES</p>
          <ImageGrid items={FACILITIES} imgHeight="h-40" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHead
          eyebrow="APPLY"
          title="매 주차 선착순으로 마감됩니다"
          desc={`"여기캠프"가 CRIS 국제학교 골프 프로그램의 한국 파트너로서 신청 접수부터 출국 안내까지 도와드립니다.`}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--brand-navy)]">신청 정보</h3>
            <dl className="mt-3 divide-y divide-gray-100 text-sm">
              {APPLY_INFO.map((row) => (
                <div key={row.k} className="flex justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-gray-400">{row.k}</dt>
                  <dd className="text-right font-medium text-[var(--brand-navy)]">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-[var(--surface-tint)] p-6 text-center">
            <p className="text-sm text-gray-500">PlanPartners × 여기캠프</p>
            <p className="mt-2 text-lg font-bold text-[var(--brand-navy)]">
              CRIS 국제학교 골프 프로그램
              <br />
              무료 체험 신청 안내받기
            </p>
            <Link
              href="/apply/travel"
              className="mx-auto mt-6 w-full max-w-xs rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)]"
            >
              신청서 작성하고 안내받기
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-gray-400">
          본 프로그램은 파트너사 여기캠프(나무투어)가 제공합니다. 상기 일정 및 혜택은 학교
          사정에 따라 변경될 수 있으며, 신청 접수 및 상세 안내는 PlanPartners를 통해
          진행됩니다.
        </p>
      </section>
    </main>
  );
}
