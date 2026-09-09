import { NextResponse } from "next/server";
import { interpretLedgerMessage } from "@/lib/gemini";
import { getGeminiApiKey } from "@/lib/env";
import { getErrorMessage } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Expense } from "@/lib/expenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id, created_at, date, amount, description";

async function loadExpenses(): Promise<Expense[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("expenses")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (error) return [];
    return (data as Expense[]) ?? [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error("[chat] GEMINI key missing. cwd=", process.cwd());
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY를 파일에서 읽지 못했습니다. my-app/.env.local 첫 줄부터 GEMINI_API_KEY= 로 시작하는지 확인하세요.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }

    const expenses = await loadExpenses();
    const parsed = await interpretLedgerMessage(message, expenses, apiKey);

    if (parsed.intent === "save" && parsed.date && parsed.amount && parsed.amount > 0 && parsed.description) {
      try {
        const supabase = createServerSupabaseClient();
        await supabase.from("expenses").insert({
          date: parsed.date,
          amount: Math.round(parsed.amount),
          description: parsed.description.trim(),
        });
      } catch {
        // DB가 막혀 있어도 대화 응답은 반환합니다.
      }
    }

    const nextExpenses = await loadExpenses();
    return NextResponse.json({
      reply: parsed.reply,
      expenses: nextExpenses.length ? nextExpenses : expenses,
    });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: getErrorMessage(err, "응답을 만들지 못했습니다.") }, { status: 500 });
  }
}
