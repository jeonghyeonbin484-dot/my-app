"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/supabase/client";

type Expense = {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  description: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function Home() {
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/expenses", { cache: "no-store" });
        const payload = (await response.json()) as { expenses?: Expense[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "데이터를 불러오지 못했습니다.");
        }
        if (!cancelled) setExpenses(payload.expenses ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "데이터를 불러오지 못했습니다."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadExpenses();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(/,/g, ""));
    if (!date || !description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amount: parsedAmount,
          description: description.trim(),
        }),
      });
      const payload = (await response.json()) as { expense?: Expense; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "저장에 실패했습니다.");
      }

      if (payload.expense) {
        setExpenses((prev) => [payload.expense as Expense, ...prev]);
      }

      setDate("");
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(getErrorMessage(err, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f6fb] font-sans text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-xl flex-col px-5 py-10 sm:py-14">
        <header className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-emerald-600 uppercase">
            Personal Ledger
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            나의 AI 가계부
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            날짜, 금액, 내용을 입력하고 지출을 기록하세요.
          </p>
        </header>

        <main className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">날짜</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">금액</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">내용</span>
              <input
                type="text"
                placeholder="예: 점심 식사, 교통비"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </form>
        </main>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-sm font-semibold text-slate-700">지출 내역</h2>
            <p className="text-sm text-slate-500">
              합계{" "}
              <span className="font-semibold text-slate-900">{formatWon(total)}원</span>
            </p>
          </div>

          {loading ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-400">
              내역을 불러오는 중...
            </p>
          ) : expenses.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-400">
              아직 저장된 지출이 없습니다.
            </p>
          ) : (
            <ul className="grid gap-3">
              {expenses.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.date}</p>
                    </div>
                    <p className="shrink-0 text-lg font-semibold text-emerald-700">
                      -{formatWon(item.amount)}원
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
