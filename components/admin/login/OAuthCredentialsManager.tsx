"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OAuthProvider } from "@/lib/oauth/credentials";

export interface OAuthProviderInfo {
  provider: OAuthProvider;
  label: string;
  clientId: string;
  hasSecret: boolean;
  updatedAt: string | null;
  redirectUri: string;
}

// 발급되는 키 형식이 플랫폼마다 달라 정확한 검증은 불가능하므로, 명백한 오입력(빈 값, 다른
// 플랫폼 키를 잘못 붙여넣는 등)을 걸러내는 최소한의 형식 체크만 수행한다.
const CLIENT_ID_VALIDATORS: Record<OAuthProvider, (value: string) => string | null> = {
  kakao: (value) =>
    /^[A-Za-z0-9]{20,40}$/.test(value)
      ? null
      : "카카오 REST API 키 형식이 아닙니다 (영문/숫자 20~40자).",
  google: (value) =>
    value.endsWith(".apps.googleusercontent.com")
      ? null
      : "구글 클라이언트 ID는 '...apps.googleusercontent.com' 형식이어야 합니다.",
};

const CLIENT_SECRET_VALIDATORS: Record<OAuthProvider, (value: string) => string | null> = {
  kakao: (value) =>
    /^[A-Za-z0-9_-]{10,64}$/.test(value) ? null : "카카오 Client Secret 형식이 아닙니다 (10자 이상).",
  google: (value) => (value.length >= 10 ? null : "구글 Client Secret이 너무 짧습니다 (10자 이상)."),
};

function ProviderCredentialCard({ info }: { info: OAuthProviderInfo }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(info.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const clientIdError = clientId ? CLIENT_ID_VALIDATORS[info.provider](clientId) : "클라이언트 ID를 입력해 주세요.";
  const clientSecretError = clientSecret
    ? CLIENT_SECRET_VALIDATORS[info.provider](clientSecret)
    : info.hasSecret
      ? null // 비워두면 기존 시크릿 유지
      : "Client Secret을 입력해 주세요.";
  const canSave = !clientIdError && !clientSecretError;

  async function handleCopyRedirectUri() {
    try {
      await navigator.clipboard.writeText(info.redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없는 브라우저도 있으므로 실패해도 조용히 무시(값은 화면에 표시되어 있음).
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const update: { client_id: string; updated_at: string; client_secret?: string } = {
      client_id: clientId.trim(),
      updated_at: new Date().toISOString(),
    };
    if (clientSecret) {
      update.client_secret = clientSecret.trim();
    }

    const { error: saveError } = await supabase.from("oauth_credentials").update(update).eq("provider", info.provider);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setClientSecret("");
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--brand-navy)]">{info.label}</h3>
        {info.hasSecret && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">설정됨</span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${info.provider}-client-id`} className="text-xs font-medium text-gray-600">
            Client ID
          </label>
          <input
            id={`${info.provider}-client-id`}
            type="text"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSaved(false);
            }}
            placeholder="클라이언트 ID 입력"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          />
          {clientIdError && <p className="mt-1 text-xs text-[var(--brand-urgent)]">{clientIdError}</p>}
        </div>

        <div>
          <label htmlFor={`${info.provider}-client-secret`} className="text-xs font-medium text-gray-600">
            Client Secret
          </label>
          <input
            id={`${info.provider}-client-secret`}
            type="password"
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value);
              setSaved(false);
            }}
            placeholder={info.hasSecret ? "변경하려면 새 값을 입력 (비워두면 기존 값 유지)" : "Client Secret 입력"}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          />
          {clientSecretError && <p className="mt-1 text-xs text-[var(--brand-urgent)]">{clientSecretError}</p>}
        </div>

        <div>
          <span className="text-xs font-medium text-gray-600">Redirect URI (개발자 콘솔에 등록)</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={info.redirectUri}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
            />
            <button
              type="button"
              onClick={handleCopyRedirectUri}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--brand-urgent)]">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-600">저장되었습니다.</p>}

      <div className="mt-4 flex items-center justify-between">
        {info.updatedAt ? (
          <span className="text-xs text-gray-400">최근 수정: {new Date(info.updatedAt).toLocaleString("ko-KR")}</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function OAuthCredentialsManager({ providers }: { providers: OAuthProviderInfo[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {providers.map((info) => (
        <ProviderCredentialCard key={info.provider} info={info} />
      ))}
    </div>
  );
}
