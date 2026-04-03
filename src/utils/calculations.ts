import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { getCategoryById } from '../constants/categories';
import { BarDataPoint, DonutDataPoint, Transaction } from '../types';

export interface BalanceStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
}

export function calcBalanceStats(transactions: Transaction[]): BalanceStats {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') totalIncome += transaction.amount;
    else totalExpense += transaction.amount;
  }

  const totalBalance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return { totalBalance, totalIncome, totalExpense, savingsRate };
}

export function getMonthlyStats(
  transactions: Transaction[],
  date: Date = new Date(),
): BalanceStats {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const monthlyTransactions = transactions.filter((transaction) =>
    isWithinInterval(parseISO(transaction.date), { start, end }),
  );

  return calcBalanceStats(monthlyTransactions);
}

export function getWeeklyBarData(transactions: Transaction[]): BarDataPoint[] {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 6), end: today });

  return days.map((day) => {
    const label = format(day, 'EEE');
    const dayStr = format(day, 'yyyy-MM-dd');
    const value = transactions
      .filter((transaction) => transaction.type === 'expense' && transaction.date === dayStr)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return { label, value };
  });
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense',
): DonutDataPoint[] {
  const filtered = transactions.filter((transaction) => transaction.type === type);
  const totals: Record<string, number> = {};

  for (const transaction of filtered) {
    totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
  }

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (total === 0) return [];

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([id, value]) => {
      const category = getCategoryById(id);
      return { label: category.label, value, color: category.color };
    });
}

export interface WeekComparison {
  thisWeekTotal: number;
  lastWeekTotal: number;
  changePercent: number;
  isIncrease: boolean;
}

export function getWeekComparison(transactions: Transaction[]): WeekComparison {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeek = subWeeks(now, 1);
  const lastWeekStart = startOfWeek(lastWeek, { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 });

  const thisWeekTotal = transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        isWithinInterval(parseISO(transaction.date), {
          start: thisWeekStart,
          end: thisWeekEnd,
        }),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const lastWeekTotal = transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        isWithinInterval(parseISO(transaction.date), {
          start: lastWeekStart,
          end: lastWeekEnd,
        }),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const changePercent =
    lastWeekTotal === 0
      ? 0
      : Math.abs(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);

  return {
    thisWeekTotal,
    lastWeekTotal,
    changePercent: Math.round(changePercent),
    isIncrease: thisWeekTotal > lastWeekTotal,
  };
}

export function getMonthlyTrend(transactions: Transaction[]): BarDataPoint[] {
  const result: BarDataPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = subMonths(new Date(), index);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const label = format(date, 'MMM');
    const value = transactions
      .filter((transaction) => {
        const transactionDate = parseISO(transaction.date);
        return (
          transaction.type === 'expense' &&
          isWithinInterval(transactionDate, { start, end })
        );
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    result.push({ label, value });
  }

  return result;
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  dayTotal: number;
}

export function groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
  const groups: Record<string, Transaction[]> = {};
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  for (const transaction of sorted) {
    if (!groups[transaction.date]) {
      groups[transaction.date] = [];
    }
    groups[transaction.date].push(transaction);
  }

  return Object.entries(groups).map(([date, groupedTransactions]) => ({
    date,
    transactions: groupedTransactions,
    dayTotal: groupedTransactions.reduce(
      (sum, transaction) =>
        sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
      0,
    ),
  }));
}

export function getTopCategory(transactions: Transaction[]): { id: string; total: number } | null {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  if (expenses.length === 0) return null;

  const totals: Record<string, number> = {};
  for (const transaction of expenses) {
    totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
  }

  const top = Object.entries(totals).sort(([, a], [, b]) => b - a)[0];
  return top ? { id: top[0], total: top[1] } : null;
}

export function calcStreak(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;

  const dates = [...new Set(transactions.map((transaction) => transaction.date))].sort((a, b) =>
    b.localeCompare(a),
  );
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const currentDate = parseISO(dates[index]);
    const previousDate = parseISO(dates[index - 1]);
    const diff = Math.round((previousDate.getTime() - currentDate.getTime()) / 86400000);

    if (diff === 1) streak += 1;
    else break;
  }

  return streak;
}
