// 통계 페이지의 "접속자 현황"에서 원본 User-Agent를 사람이 읽을 수 있는 기기/브라우저/OS로
// 변환한다. 별도 npm 패키지 없이(엣지 런타임 호환) 정규식만으로 흔한 케이스를 구분한다.
export interface ParsedUserAgent {
  deviceModel: string;
  browser: string;
  osName: string;
}

const IN_APP_BROWSERS: { pattern: RegExp; label: string }[] = [
  { pattern: /KAKAOTALK/i, label: "카카오톡" },
  { pattern: /NAVER\(/i, label: "네이버 앱" },
  { pattern: /Whale/i, label: "네이버 웨일" },
  { pattern: /Instagram/i, label: "인스타그램" },
  { pattern: /FBAN|FBAV|FB_IAB/i, label: "페이스북" },
  { pattern: /Line\//i, label: "라인" },
];

function detectOs(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "기타";
}

function detectDeviceModel(ua: string, osName: string): string {
  const samsung = ua.match(/SM-[A-Z0-9]+/i);
  if (samsung) return samsung[0].toUpperCase();
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (osName === "Android") return "Android 기기";
  if (osName === "Windows" || osName === "macOS" || osName === "Linux") return "PC";
  return "알 수 없음";
}

function detectBrowser(ua: string): string {
  for (const { pattern, label } of IN_APP_BROWSERS) {
    if (pattern.test(ua)) return label;
  }
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/CriOS/i.test(ua)) return "Chrome (iOS)";
  if (/FxiOS/i.test(ua)) return "Firefox (iOS)";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return "Safari";
  return "기타";
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { deviceModel: "알 수 없음", browser: "알 수 없음", osName: "알 수 없음" };
  }
  const osName = detectOs(userAgent);
  return {
    deviceModel: detectDeviceModel(userAgent, osName),
    browser: detectBrowser(userAgent),
    osName,
  };
}
