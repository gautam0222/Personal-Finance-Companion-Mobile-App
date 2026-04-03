import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

function formatCompactValue(value: number): string {
  const formatted = value.toFixed(1);
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
}

export function formatCurrency(
  amount: number,
  symbol: string = '₹',
  showSign: boolean = false,
  compact: boolean = false,
): string {
  const abs = Math.abs(amount);
  const sign = showSign ? (amount >= 0 ? '+' : '-') : amount < 0 ? '-' : '';

  if (compact) {
    if (abs >= 10_000_000) return `${sign}${symbol}${formatCompactValue(abs / 10_000_000)}Cr`;
    if (abs >= 100_000) return `${sign}${symbol}${formatCompactValue(abs / 100_000)}L`;
    if (abs >= 1_000) return `${sign}${symbol}${formatCompactValue(abs / 1_000)}K`;
    return `${sign}${symbol}${abs.toFixed(0)}`;
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs);

  return `${sign}${symbol}${formatted}`;
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM');
  } catch {
    return dateStr;
  }
}

export function formatDateRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatTransactionGroupDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, dd MMM');
  } catch {
    return dateStr;
  }
}

export function formatMonth(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDayOfWeek(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE');
  } catch {
    return '';
  }
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isSameDay(a: string, b: string): boolean {
  try {
    return format(parseISO(a), 'yyyy-MM-dd') === format(parseISO(b), 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function toPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

export function roundTo(val: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}
