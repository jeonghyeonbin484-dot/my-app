import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function createSupabaseClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("Supabase URL 또는 API KEY가 설정되지 않았습니다.");
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export function toFriendlyError(message: string) {
  if (/failed to fetch|fetch failed|networkerror|load failed|aborted|timeout|timed out/i.test(message)) {
    return "이 PC 네트워크에서 supabase.co 접속이 차단되어 있습니다. 휴대폰 핫스팟으로 바꾼 뒤 페이지를 새로고침하고 다시 저장해 주세요.";
  }
  if (/high demand|try again later/i.test(message)) {
    return "Gemini 서버가 혼잡합니다. 잠시 후 다시 보내 주세요.";
  }
  return message;
}

export function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return toFriendlyError(err.message);
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return toFriendlyError((err as { message: string }).message);
  }
  return fallback;
}
