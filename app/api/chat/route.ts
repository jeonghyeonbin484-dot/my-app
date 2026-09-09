import { NextResponse } from "next/server";
import { interpretLedgerMessage } from "@/lib/gemini";
import { getErrorMessage } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id, created_at, date, amount, description";

async function loadExpenses() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }

    const { loadLocalEnvIntoProcess, getGeminiApiKey } = await import("@/lib/env");
    loadLocalEnvIntoProcess();
    if (!getGeminiApiKey()) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인한 뒤 개발 서버를 재시작하세요.");
    }

    const expenses = await loadExpenses();
    const parsed = await interpretLedgerMessage(message, expenses);

    if (parsed.intent === "save" && parsed.date && parsed.amount && parsed.amount > 0 && parsed.description) {
      const supabase = createServerSupabaseClient();
      const { error } = await supabase.from("expenses").insert({
        date: parsed.date,
        amount: Math.round(parsed.amount),
        description: parsed.description.trim(),
      });
      if (error) {
        return NextResponse.json({ error: getErrorMessage(error, "저장에 실패했습니다.") }, { status: 400 });
      }
    }

    const nextExpenses = await loadExpenses();
    return NextResponse.json({
      reply: parsed.reply,
      expenses: nextExpenses,
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "응답을 만들지 못했습니다.") }, { status: 500 });
  }
}
