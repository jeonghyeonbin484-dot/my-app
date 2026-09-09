import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id, created_at, date, amount, description";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("expenses")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ error: getErrorMessage(error, "데이터를 불러오지 못했습니다.") }, { status: 400 });
    }

    return NextResponse.json({ expenses: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "데이터를 불러오지 못했습니다.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      amount?: number;
      description?: string;
    };

    const date = body.date?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const amount = Number(body.amount);

    if (!date || !description || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "날짜, 금액, 내용을 모두 입력해 주세요." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({ date, amount, description })
      .select(COLUMNS)
      .single();

    if (error) {
      return NextResponse.json({ error: getErrorMessage(error, "저장에 실패했습니다.") }, { status: 400 });
    }

    return NextResponse.json({ expense: data });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "저장에 실패했습니다.") }, { status: 500 });
  }
}
