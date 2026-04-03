import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { useGoalStore } from "../store/useGoalStore";
import { useTransactionStore } from "../store/useTransactionStore";
import { KarmaData, KarmaLevel } from "../types";
import { calcStreak, getMonthlyStats } from "../utils/calculations";

function getLevel(score: number): {
  level: KarmaLevel;
  badge: string;
  nextAt: number;
} {
  if (score >= 85) return { level: "Legend", badge: "👑", nextAt: 100 };
  if (score >= 65) return { level: "Master", badge: "💎", nextAt: 85 };
  if (score >= 45) return { level: "Saver", badge: "🌟", nextAt: 65 };
  if (score >= 25) return { level: "Tracker", badge: "⚡", nextAt: 45 };
  return { level: "Novice", badge: "🌱", nextAt: 25 };
}

export function useKarma(): KarmaData {
  const transactions = useTransactionStore((s) => s.transactions);
  const goals = useGoalStore((s) => s.goals);
  const settings = useAppStore((s) => s.settings);

  return useMemo(() => {
    let score = 0;

    const txnCount = transactions.length;
    score += Math.min(20, txnCount * 2);

    const streak = calcStreak(transactions);
    score += Math.min(20, streak * 3);

    const monthly = getMonthlyStats(transactions, new Date());
    if (monthly.totalIncome > 0) {
      score += Math.round((monthly.savingsRate / 100) * 20);
    }

    if (settings.monthlyBudget > 0 && monthly.totalExpense > 0) {
      const ratio = monthly.totalExpense / settings.monthlyBudget;
      if (ratio <= 0.5) score += 20;
      else if (ratio <= 0.7) score += 15;
      else if (ratio <= 0.9) score += 10;
      else if (ratio <= 1.0) score += 5;
    } else if (settings.monthlyBudget === 0 && transactions.length > 0) {
      score += 5;
    }

    score += Math.min(
      10,
      goals.filter((goal) => goal.isActive && !goal.isCompleted).length * 5,
    );
    score += Math.min(10, goals.filter((goal) => goal.isCompleted).length * 5);

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));
    const { level, badge, nextAt } = getLevel(finalScore);

    const lastLogDate =
      transactions.length > 0
        ? ([...transactions].sort((a, b) => b.date.localeCompare(a.date))[0]
            ?.date ?? null)
        : null;

    return {
      score: finalScore,
      streakDays: streak,
      lastLogDate,
      level,
      badge,
      nextLevelAt: nextAt,
    };
  }, [transactions, goals, settings]);
}
