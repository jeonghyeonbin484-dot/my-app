"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { type Expense, formatWon } from "@/lib/expenses";
import { getErrorMessage } from "@/lib/supabase/client";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "안녕하세요. 지출을 말씀해 주세요.\n예: 오늘 점심 8,000원",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/expenses", { cache: "no-store" });
        const payload = (await response.json()) as { expenses?: Expense[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "데이터를 불러오지 못했습니다.");
        if (!cancelled) setExpenses(payload.expenses ?? []);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "데이터를 불러오지 못했습니다."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadExpenses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const payload = (await response.json()) as {
        reply?: string;
        expenses?: Expense[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "응답을 받지 못했습니다.");

      if (payload.expenses) setExpenses(payload.expenses);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: payload.reply ?? "알겠어요.",
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(err, "응답을 만들지 못했습니다.");
      setError(message);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: message },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#b8d0e8] font-sans text-slate-800 sm:max-w-xl">
      <header className="shrink-0 bg-white px-4 py-3.5 text-center shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          AI 가계부 챗봇
        </h1>
      </header>

      <section className="shrink-0 bg-white/80 px-3 py-3 backdrop-blur-sm sm:px-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-700">지출 내역</h2>
          <p className="text-base text-slate-500">
            합계 <span className="font-bold text-slate-800">{formatWon(total)}원</span>
          </p>
        </div>
        <div className="max-h-44 overflow-y-auto overscroll-contain sm:max-h-52">
          {loading ? (
            <p className="rounded-2xl bg-white px-4 py-5 text-center text-base text-slate-400">
              내역을 불러오는 중...
            </p>
          ) : expenses.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-5 text-center text-base text-slate-400">
              아직 저장된 지출이 없습니다.
            </p>
          ) : (
            <ul className="grid gap-2">
              {expenses.map((item) => (
                <li key={item.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <p className="text-sm text-slate-400 sm:text-base">{item.date}</p>
                    <p className="truncate text-base font-medium text-slate-800">{item.description}</p>
                    <p className="text-base font-bold text-slate-900 sm:text-lg">
                      {formatWon(item.amount)}원
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        <div className="flex flex-col gap-3">
          {messages.map((item) => (
            <div
              key={item.id}
              className={item.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={
                  item.role === "user"
                    ? "max-w-[80%] whitespace-pre-wrap rounded-[18px] rounded-br-sm bg-[#fee500] px-4 py-2.5 text-[17px] leading-relaxed text-slate-900 shadow-sm"
                    : "max-w-[80%] whitespace-pre-wrap rounded-[18px] rounded-bl-sm bg-white px-4 py-2.5 text-[17px] leading-relaxed text-slate-800 shadow-sm"
                }
              >
                {item.text}
              </p>
            </div>
          ))}
          {sending ? (
            <div className="flex justify-start">
              <p className="rounded-[18px] rounded-bl-sm bg-white px-4 py-2.5 text-[17px] text-slate-400 shadow-sm">
                입력 중...
              </p>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </main>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 bg-[#f5f5f5] px-3 py-2.5 pb-[max(0.7rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={sending}
            className="min-h-12 flex-1 rounded-full border-0 bg-white px-4 text-[17px] text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-slate-300"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="min-h-12 min-w-[4.25rem] rounded-full bg-[#fee500] px-4 text-base font-bold text-slate-900 transition enabled:active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
