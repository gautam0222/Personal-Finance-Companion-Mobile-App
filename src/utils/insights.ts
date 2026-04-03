import { Transaction, InsightItem } from '../types';
import { getCategoryById } from '../constants/categories';
import {
  getWeekComparison,
  getTopCategory,
  getMonthlyStats,
  calcStreak,
} from './calculations';
import { formatCurrency } from './formatters';

// icon field is an Ionicons glyph name — never emoji
export function generateInsights(
  transactions: Transaction[],
  currencySymbol: string,
  monthlyBudget: number,
): InsightItem[] {
  const insights: InsightItem[] = [];
  const now     = new Date();
  const monthly = getMonthlyStats(transactions, now);
  const streak  = calcStreak(transactions);
  const weekComp = getWeekComparison(transactions);
  const topCat  = getTopCategory(transactions);

  // 1. Streak
  if (streak >= 7) {
    insights.push({
      id: 'streak-7', type: 'achievement',
      title: `${streak}-day logging streak`,
      description: "You're building a rock-solid habit. Consistency is the edge.",
      icon: 'flame-outline', color: '#F59E0B',
    });
  } else if (streak >= 3) {
    insights.push({
      id: 'streak-3', type: 'achievement',
      title: `${streak} days in a row`,
      description: 'Good momentum. Hit 7 days to unlock the next streak milestone.',
      icon: 'flash-outline', color: '#F59E0B',
    });
  }

  // 2. Budget warning
  if (monthlyBudget > 0 && monthly.totalExpense > 0) {
    const pct = (monthly.totalExpense / monthlyBudget) * 100;
    if (pct >= 90) {
      insights.push({
        id: 'budget-critical', type: 'warning',
        title: 'Budget almost exhausted',
        description: `${Math.round(pct)}% of your monthly budget used. ${formatCurrency(monthlyBudget - monthly.totalExpense, currencySymbol)} remaining.`,
        icon: 'alert-circle-outline', color: '#F43F5E',
        value: `${Math.round(pct)}%`,
      });
    } else if (pct >= 70) {
      insights.push({
        id: 'budget-warning', type: 'warning',
        title: 'Approaching your budget',
        description: `${Math.round(pct)}% used. You have ${formatCurrency(monthlyBudget - monthly.totalExpense, currencySymbol)} left this month.`,
        icon: 'warning-outline', color: '#F59E0B',
        value: `${Math.round(pct)}%`,
      });
    }
  }

  // 3. Week-over-week
  if (weekComp.lastWeekTotal > 0) {
    if (weekComp.isIncrease && weekComp.changePercent > 20) {
      insights.push({
        id: 'week-increase', type: 'warning',
        title: `Spending up ${weekComp.changePercent}% this week`,
        description: `${formatCurrency(weekComp.thisWeekTotal, currencySymbol)} vs ${formatCurrency(weekComp.lastWeekTotal, currencySymbol)} last week.`,
        icon: 'trending-up-outline', color: '#F43F5E',
        value: `+${weekComp.changePercent}%`,
      });
    } else if (!weekComp.isIncrease && weekComp.changePercent > 10) {
      insights.push({
        id: 'week-decrease', type: 'achievement',
        title: `Spending down ${weekComp.changePercent}% this week`,
        description: `Saved ${formatCurrency(weekComp.lastWeekTotal - weekComp.thisWeekTotal, currencySymbol)} compared to last week.`,
        icon: 'trending-down-outline', color: '#10B981',
        value: `-${weekComp.changePercent}%`,
      });
    }
  }

  // 4. Top category
  if (topCat) {
    const cat = getCategoryById(topCat.id);
    insights.push({
      id: 'top-category', type: 'info',
      title: `Top spend: ${cat.label}`,
      description: `${formatCurrency(topCat.total, currencySymbol)} spent on ${cat.label.toLowerCase()} overall.`,
      icon: cat.icon,   // already an ionicon name from updated categories.ts
      color: cat.color,
      value: formatCurrency(topCat.total, currencySymbol, false, true),
    });
  }

  // 5. Savings rate
  if (monthly.totalIncome > 0) {
    const rate = monthly.savingsRate;
    if (rate >= 30) {
      insights.push({
        id: 'savings-great', type: 'achievement',
        title: `Saving ${Math.round(rate)}% of income`,
        description: "Excellent discipline — well above the recommended 20%.",
        icon: 'shield-checkmark-outline', color: '#10B981',
        value: `${Math.round(rate)}%`,
      });
    } else if (rate < 10 && monthly.totalExpense > 0) {
      insights.push({
        id: 'savings-low', type: 'tip',
        title: 'Savings rate below 10%',
        description: 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        icon: 'bulb-outline', color: '#6366F1',
        value: `${Math.round(rate)}%`,
      });
    }
  }

  // 6. No data nudge
  if (transactions.length === 0) {
    insights.push({
      id: 'get-started', type: 'tip',
      title: 'Start tracking today',
      description: 'Add your first transaction to unlock insights and your Karma Score.',
      icon: 'add-circle-outline', color: '#6366F1',
    });
  }

  // 7. Strong month
  if (monthly.totalIncome > 0 && monthly.totalBalance > monthly.totalIncome * 0.4) {
    insights.push({
      id: 'great-month', type: 'achievement',
      title: 'Strong month',
      description: `You're keeping ${formatCurrency(monthly.totalBalance, currencySymbol)} of your income this month.`,
      icon: 'star-outline', color: '#6366F1',
    });
  }

  return insights.slice(0, 5);
}