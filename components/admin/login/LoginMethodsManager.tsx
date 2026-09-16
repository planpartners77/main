"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LoginMethodsSettings } from "@/lib/design/site-settings";

export function LoginMethodsManager({ settings }: { settings: LoginMethodsSettings }) {
  const router = useRouter();
  const [kakaoEnabled, setKakaoEnabled] = useState(settings.kakao);
  const [firstDelaySeconds, setFirstDelaySeconds] = useState(settings.popupFirstDelaySeconds);
  const [repeatMinutes, setRepeatMinutes] = useState(settings.popupRepeatMinutes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({
        value: {
          kakao: kakaoEnabled,
          google: false,
          popupFirstDelaySeconds: Math.max(0, firstDelaySeconds),
          popupRepeatMinutes: Math.max(0.1, repeatMinutes),
        },
      })
      .eq("key", "login_methods");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-[var(--brand-navy)]">카카오 로그인 (카카오싱크)</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              켜면 로그인 화면에 &quot;카카오로 시작하기&quot; 버튼이 노출됩니다. 카카오
              디벨로퍼스 비즈 앱 등록과 간편가입 동의항목 심사가 완료된 뒤에 켜세요.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={kakaoEnabled}
            onClick={() => {
              setKakaoEnabled((v) => !v);
              setSaved(false);
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              kakaoEnabled ? "bg-[var(--brand-blue)]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                kakaoEnabled ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">로그인 유도 팝업 노출 주기</p>
        <p className="mt-0.5 text-xs text-gray-500">
          카카오 로그인이 꺼져 있거나 이미 로그인한 회원에게는 노출되지 않습니다. 닫아도 로그인하기
          전까지는 설정한 주기마다 다시 노출됩니다.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500">
            최초 노출까지 대기 시간(초)
            <input
              type="number"
              min={0}
              step={1}
              value={firstDelaySeconds}
              onChange={(e) => {
                setFirstDelaySeconds(Number(e.target.value));
                setSaved(false);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            재노출 주기(분)
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={repeatMinutes}
              onChange={(e) => {
                setRepeatMinutes(Number(e.target.value));
                setSaved(false);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 opacity-60">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-gray-500">구글 로그인</span>
            <span className="mt-0.5 block text-xs text-gray-400">
              아직 연동 전이라 비노출 상태로 고정되어 있습니다. (준비 중)
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={false}
            disabled
            className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-300"
          >
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white" />
          </button>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-[var(--brand-mint)]">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
