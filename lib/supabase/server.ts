import { setDefaultResultOrder } from "node:dns";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

setDefaultResultOrder("ipv4first");

let client: SupabaseClient | undefined;

function env(name: string) {
  return process.env[name]?.trim();
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const timeout = AbortSignal.timeout(8000);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

export function createServerSupabaseClient() {
  if (client) return client;

  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    env("SUPABASE_SECRET_KEY") ??
    env("SUPABASE_SERVICE_ROLE_KEY") ??
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    throw new Error("Supabase URL 또는 API KEY가 설정되지 않았습니다.");
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  });

  return client;
}
