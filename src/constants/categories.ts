import { Category } from '../types';

// All icons are Ionicons glyph names — rendered with <Ionicons name={cat.icon} />
// No emoji anywhere in the category system.
export const CATEGORIES: Category[] = [
  // ── Expense ──────────────────────────────────────────────────────────────
  { id: 'food',          label: 'Food & Dining',    icon: 'restaurant-outline',       color: '#EA580C', applicableTo: ['expense'] },
  { id: 'transport',     label: 'Transport',         icon: 'car-outline',              color: '#3B82F6', applicableTo: ['expense'] },
  { id: 'shopping',      label: 'Shopping',          icon: 'bag-outline',              color: '#EC4899', applicableTo: ['expense'] },
  { id: 'entertainment', label: 'Entertainment',     icon: 'film-outline',             color: '#8B5CF6', applicableTo: ['expense'] },
  { id: 'health',        label: 'Health',            icon: 'medkit-outline',           color: '#10B981', applicableTo: ['expense'] },
  { id: 'education',     label: 'Education',         icon: 'book-outline',             color: '#F59E0B', applicableTo: ['expense'] },
  { id: 'utilities',     label: 'Bills & Utilities', icon: 'flash-outline',            color: '#64748B', applicableTo: ['expense'] },
  { id: 'housing',       label: 'Housing & Rent',    icon: 'home-outline',             color: '#14B8A6', applicableTo: ['expense'] },
  { id: 'personal',      label: 'Personal Care',     icon: 'cut-outline',              color: '#F472B6', applicableTo: ['expense'] },
  { id: 'travel',        label: 'Travel',            icon: 'airplane-outline',         color: '#0EA5E9', applicableTo: ['expense'] },
  { id: 'subscriptions', label: 'Subscriptions',     icon: 'phone-portrait-outline',   color: '#A78BFA', applicableTo: ['expense'] },
  // ── Income ───────────────────────────────────────────────────────────────
  { id: 'salary',        label: 'Salary',            icon: 'briefcase-outline',        color: '#10B981', applicableTo: ['income'] },
  { id: 'freelance',     label: 'Freelance',         icon: 'laptop-outline',           color: '#6366F1', applicableTo: ['income'] },
  { id: 'investment',    label: 'Investment',        icon: 'trending-up-outline',      color: '#F59E0B', applicableTo: ['income'] },
  { id: 'bonus',         label: 'Bonus',             icon: 'trophy-outline',           color: '#FCD34D', applicableTo: ['income'] },
  { id: 'rental',        label: 'Rental Income',     icon: 'business-outline',         color: '#2DD4BF', applicableTo: ['income'] },
  // ── Shared ───────────────────────────────────────────────────────────────
  { id: 'gift',          label: 'Gift',              icon: 'gift-outline',             color: '#F472B6', applicableTo: ['income', 'expense'] },
  { id: 'transfer',      label: 'Transfer',          icon: 'swap-horizontal-outline',  color: '#94A3B8', applicableTo: ['income', 'expense'] },
  { id: 'other',         label: 'Other',             icon: 'grid-outline',             color: '#64748B', applicableTo: ['income', 'expense'] },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? {
    id: 'other', label: 'Other',
    icon: 'grid-outline', color: '#64748B',
    applicableTo: ['income', 'expense'],
  };

export const getCategoriesForType = (type: 'income' | 'expense'): Category[] =>
  CATEGORIES.filter((c) => c.applicableTo.includes(type));

export const CURRENCY_OPTIONS = [
  { code: 'INR' as const, symbol: '₹',   label: 'Indian Rupee'  },
  { code: 'USD' as const, symbol: '$',   label: 'US Dollar'     },
  { code: 'EUR' as const, symbol: '€',   label: 'Euro'          },
  { code: 'GBP' as const, symbol: '£',   label: 'British Pound' },
  { code: 'JPY' as const, symbol: '¥',   label: 'Japanese Yen'  },
  { code: 'AED' as const, symbol: 'د.إ', label: 'UAE Dirham'    },
];