import { ThemeMode } from '../types';

const dark = {
  background:          '#080C14',
  backgroundSecondary: '#0D1220',
  card:                '#111827',
  cardElevated:        '#1A2332',
  overlay:             'rgba(0,0,0,0.80)',

  border:      '#1F2D3D',
  borderLight: '#283B50',

  primary:            '#6366F1',
  primaryLight:       '#818CF8',
  primaryDark:        '#4F46E5',
  primaryMuted:       'rgba(99,102,241,0.12)',
  primaryMutedBorder: 'rgba(99,102,241,0.28)',

  secondary:      '#22D3EE',
  secondaryLight: '#67E8F9',
  secondaryMuted: 'rgba(34,211,238,0.12)',

  income:      '#10B981',
  incomeDark:  '#059669',
  incomeMuted: 'rgba(16,185,129,0.12)',
  incomeText:  '#34D399',

  expense:      '#F43F5E',
  expenseDark:  '#E11D48',
  expenseMuted: 'rgba(244,63,94,0.12)',
  expenseText:  '#FB7185',

  warning:      '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.12)',
  danger:       '#F43F5E',
  success:      '#10B981',

  text:          '#E2E8F0',
  textSecondary: '#94A3B8',
  textTertiary:  '#475569',
  textInverse:   '#080C14',
  white:         '#FFFFFF',

  food:          '#EA580C',
  transport:     '#3B82F6',
  shopping:      '#EC4899',
  entertainment: '#8B5CF6',
  health:        '#10B981',
  education:     '#F59E0B',
  utilities:     '#64748B',
  housing:       '#14B8A6',
  salary:        '#10B981',
  freelance:     '#6366F1',
  investment:    '#F59E0B',
  gift:          '#F472B6',
  other:         '#64748B',
};

const light = {
  background:          '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  card:                '#FFFFFF',
  cardElevated:        '#F8FAFC',
  overlay:             'rgba(0,0,0,0.55)',

  border:      '#E2E8F0',
  borderLight: '#F1F5F9',

  primary:            '#4F46E5',
  primaryLight:       '#6366F1',
  primaryDark:        '#3730A3',
  primaryMuted:       'rgba(79,70,229,0.08)',
  primaryMutedBorder: 'rgba(79,70,229,0.22)',

  secondary:      '#0891B2',
  secondaryLight: '#06B6D4',
  secondaryMuted: 'rgba(8,145,178,0.10)',

  income:      '#059669',
  incomeDark:  '#047857',
  incomeMuted: 'rgba(5,150,105,0.10)',
  incomeText:  '#047857',

  expense:      '#E11D48',
  expenseDark:  '#BE123C',
  expenseMuted: 'rgba(225,29,72,0.08)',
  expenseText:  '#BE123C',

  warning:      '#D97706',
  warningMuted: 'rgba(217,119,6,0.10)',
  danger:       '#E11D48',
  success:      '#059669',

  text:          '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#94A3B8',
  textInverse:   '#F8FAFC',
  white:         '#FFFFFF',

  food:          '#EA580C',
  transport:     '#2563EB',
  shopping:      '#DB2777',
  entertainment: '#7C3AED',
  health:        '#059669',
  education:     '#D97706',
  utilities:     '#475569',
  housing:       '#0F766E',
  salary:        '#059669',
  freelance:     '#4F46E5',
  investment:    '#D97706',
  gift:          '#DB2777',
  other:         '#64748B',
};

export type ColorScheme = typeof dark;
export const Colors: Record<ThemeMode, ColorScheme> = { dark, light };

export const Gradients = {
  primary:     ['#6366F1', '#4F46E5'] as const,
  income:      ['#10B981', '#059669'] as const,
  expense:     ['#F43F5E', '#E11D48'] as const,
  card:        ['#1A2332', '#111827'] as const,
  karma:       ['#6366F1', '#8B5CF6'] as const,
  balanceCard: ['#0D1425', '#111827'] as const,
};