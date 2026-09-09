import { getGeminiApiKey } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Expense } from "@/lib/expenses";
import { formatWon } from "@/lib/expenses";

export type ChatIntent = {
  intent: "save" | "query" | "chat";
  date: string | null;
  amount: number | null;
  description: string | null;
  reply: string;
};

function todayKst() {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function parseJson(text: string): ChatIntent {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<ChatIntent>;
  const intent = parsed.intent === "save" || parsed.intent === "query" ? parsed.intent : "chat";
  const amount =
    typeof parsed.amount === "number" && Number.isFinite(parsed.amount) ? parsed.amount : null;

  return {
    intent,
    date: typeof parsed.date === "string" && parsed.date ? parsed.date : null,
    amount,
    description: typeof parsed.description === "string" && parsed.description ? parsed.description : null,
    reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : "알겠어요.",
  };
}

export async function interpretLedgerMessage(message: string, expenses: Expense[]): Promise<ChatIntent> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const recent = expenses
    .slice(0, 12)
    .map((item) => `- ${item.date} / ${formatWon(item.amount)}원 / ${item.description}`)
    .join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const prompt = `너는 한국어 가계부 챗봇이다. 사용자 말에서 지출을 파악하거나 내역을 안내한다.
오늘은 ${todayKst()} (Asia/Seoul)이다.
날짜는 YYYY-MM-DD 형식으로만 적어라. "오늘"은 오늘 날짜, "어제"는 하루 전이다.
금액은 정수 원 단위다. "1만2천원"은 12000이다.

반드시 JSON만 반환:
{
  "intent": "save" | "query" | "chat",
  "date": string | null,
  "amount": number | null,
  "description": string | null,
  "reply": string
}

규칙:
- 날짜, 금액, 내용이 있으면 intent는 save. 빠진 값이 있으면 intent는 chat으로 두고 reply에서 부족한 것만 물어본다.
- 합계/내역 질문이면 intent는 query. reply에 아래 내역을 바탕으로 짧게 답한다.
- 그 외는 intent chat.
- reply는 친근한 한국어 한두 문장.

현재 지출 합계: ${formatWon(total)}원
최근 내역:
${recent || "(없음)"}

사용자: ${message}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJson(text);
}
