// Transaction
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  receiptUri?: string; // Local file URI to the image
  createdAt: string;
  updatedAt: string;
  isRecurring?: boolean;
  recurringId?: string;
  splitId?: string; // linked Split.id - optional
}

// Recurring
export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  lastExecutedDate?: string;
  isActive: boolean;
  totalExecuted: number;
  createdAt: string;
}

// Net Worth
export type NetWorthEntryKind = 'asset' | 'liability';

export type AssetSubtype =
  | 'savings_account'
  | 'fixed_deposit'
  | 'mutual_fund'
  | 'stocks'
  | 'real_estate'
  | 'gold'
  | 'crypto'
  | 'cash'
  | 'other_asset';

export type LiabilitySubtype =
  | 'home_loan'
  | 'car_loan'
  | 'personal_loan'
  | 'credit_card'
  | 'education_loan'
  | 'other_liability';

export type NetWorthSubtype = AssetSubtype | LiabilitySubtype;

export interface NetWorthEntry {
  id: string;
  kind: NetWorthEntryKind; // 'asset' | 'liability'
  subtype: NetWorthSubtype; // granular category id
  name: string; // e.g. "HDFC Savings", "ICICI Home Loan"
  value: number; // current value / outstanding balance
  institution?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  monthKey: string; // "yyyy-MM"
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  recordedAt: string; // ISO datetime of last update this month
}

// Splits / Shared Expenses
export interface Friend {
  id: string;
  name: string;
  phone?: string;
  avatarColor: string;
  createdAt: string;
}

export type SplitStatus = 'pending' | 'settled';
export type SplitMode = 'equal' | 'custom';

export interface SplitParticipant {
  friendId: string;
  share: number; // amount this person owes you
  status: SplitStatus;
  settledAt?: string;
}

export interface Split {
  id: string;
  transactionId?: string; // splits can exist without a transaction
  totalAmount: number;
  myShare: number; // your portion = totalAmount - sum(participants.share)
  splitMode: SplitMode;
  note: string;
  date: string; // YYYY-MM-DD
  participants: SplitParticipant[];
  createdAt: string;
}

// Goal
export type GoalType = 'savings' | 'no-spend' | 'budget-limit';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  type: GoalType;
  category?: string;
  icon: string;
  color: string;
  createdAt: string;
  isCompleted: boolean;
  isActive: boolean;
  completedAt?: string;
}

// App Settings
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
  hapticsEnabled: boolean;
  monthlyBudget: number;
  appLockEnabled: boolean;
  biometricLockEnabled: boolean;
  lockGracePeriodSeconds: number;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

// Karma
export type KarmaLevel = 'Novice' | 'Tracker' | 'Saver' | 'Master' | 'Legend';

export interface KarmaData {
  score: number;
  streakDays: number;
  lastLogDate: string | null;
  level: KarmaLevel;
  badge: string;
  nextLevelAt: number;
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

// Charts
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
  NetWorth: undefined;
  Splits: undefined;
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
