// Recurring types
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  lastExecutedDate?: string;
  isActive: boolean;
  totalExecuted: number;
  note: string;
  createdAt: string;
}

// Transaction
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;        // ISO date string (YYYY-MM-DD)
  note: string;
  receiptUri?: string; // Local file URI to the image
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: string;   // ISO datetime
  updatedAt: string;
}

// Goal
export type GoalType = 'savings' | 'no-spend' | 'budget-limit';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;    // ISO date string
  type: GoalType;
  category?: string;   // used for budget-limit goals
  icon: string;
  color: string;
  createdAt: string;
  isCompleted: boolean;
  isActive: boolean;
  completedAt?: string;
}

// App settings
export type ThemeMode = 'dark' | 'light';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AED';

export interface CurrencyOption {
  code: Currency;
  symbol: string;
  label: string;
}

export interface AppSettings {
  userName: string;
  avatarUri?: string;
  currency: Currency;
  currencySymbol: string;
  hasOnboarded: boolean;
  theme: ThemeMode;
  monthlyBudget: number;
  appLockEnabled: boolean;
  biometricLockEnabled: boolean;
  lockGracePeriodSeconds: number;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

// Karma / gamification
export type KarmaLevel = 'Novice' | 'Tracker' | 'Saver' | 'Master' | 'Legend';

export interface KarmaData {
  score: number;         // 0-100
  streakDays: number;
  lastLogDate: string | null;
  level: KarmaLevel;
  badge: string;         // emoji
  nextLevelAt: number;   // score needed for next level
}

// Insights
export type InsightType = 'tip' | 'warning' | 'achievement' | 'info';

export interface InsightItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  value?: string;
  color?: string;
}

// Category
export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  applicableTo: ('income' | 'expense')[];
}

// Chart data
export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface LineDataPoint {
  x: number;
  y: number;
  label?: string;
}

// Navigation
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  AddTransaction: { transactionId?: string } | undefined;
  Recurring: undefined;
  Backup: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Goals: undefined;
  Insights: undefined;
  Settings: undefined;
};

// Filters
export type TransactionFilter = 'all' | 'income' | 'expense';
export type DateRangeFilter = 'week' | 'month' | '3months' | 'all';

export interface FilterState {
  type: TransactionFilter;
  dateRange: DateRangeFilter;
  category: string | null;
  searchQuery: string;
}
