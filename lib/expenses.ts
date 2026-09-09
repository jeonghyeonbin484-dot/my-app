export type Expense = {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  description: string;
};

export function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}
