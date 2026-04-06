import {
    parseISO, format, isAfter, isBefore, isEqual,
    addDays, addWeeks, addMonths, addYears,
} from 'date-fns';
import { RecurringTransaction, RecurrenceFrequency, Transaction } from '../types';

// ─── Display helpers ──────────────────────────────────────────────────────────

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export const FREQUENCY_SHORT: Record<RecurrenceFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

// ─── Compute next due date after a given occurrence ───────────────────────────

export function computeNextDueDate(
    currentDue: string,
    frequency: RecurrenceFrequency,
): string {
    const d = parseISO(currentDue);
    switch (frequency) {
        case 'daily': return format(addDays(d, 1), 'yyyy-MM-dd');
        case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd');
        case 'biweekly': return format(addWeeks(d, 2), 'yyyy-MM-dd');
        case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd');
        case 'quarterly': return format(addMonths(d, 3), 'yyyy-MM-dd');
        case 'yearly': return format(addYears(d, 1), 'yyyy-MM-dd');
    }
}

// ─── Process result per recurring rule ───────────────────────────────────────

export interface RecurringProcessResult {
    recurringId: string;
    transactionsCreated: Transaction[];
    updatedNextDueDate: string;
    updatedLastExecuted: string;
    updatedTotalExecuted: number;
}

function genId(suffix: number): string {
    return `txn_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${suffix}`;
}

// ─── Main engine ──────────────────────────────────────────────────────────────
// Runs on every app launch. For each active recurring rule whose nextDueDate
// is on or before today, creates transaction records and advances nextDueDate.
// Handles multiple missed periods (e.g. app not opened for 2 months).
// Safety cap: will never create more than 366 transactions per rule per run.

export function processAllDueRecurring(
    rules: RecurringTransaction[],
    todayStr: string,           // 'yyyy-MM-dd'
): RecurringProcessResult[] {
    const results: RecurringProcessResult[] = [];
    const MAX_PER_RULE = 366;
    const now = new Date().toISOString();

    for (const rule of rules) {
        if (!rule.isActive) continue;

        // Already up to date
        if (rule.nextDueDate > todayStr) continue;

        // Rule has passed its end date
        if (rule.endDate && rule.nextDueDate > rule.endDate) continue;

        const created: Transaction[] = [];
        let nextDue = rule.nextDueDate;
        let totalExecuted = rule.totalExecuted;
        let iterations = 0;

        while (nextDue <= todayStr && iterations < MAX_PER_RULE) {
            // Stop if we've passed the end date
            if (rule.endDate && nextDue > rule.endDate) break;

            created.push({
                id: genId(iterations),
                amount: rule.amount,
                type: rule.type,
                category: rule.category,
                date: nextDue,           // use the ACTUAL due date, not today
                note: rule.note,
                createdAt: now,
                updatedAt: now,
                isRecurring: true,
                recurringId: rule.id,
            });

            totalExecuted++;
            nextDue = computeNextDueDate(nextDue, rule.frequency);
            iterations++;
        }

        if (created.length > 0) {
            results.push({
                recurringId: rule.id,
                transactionsCreated: created,
                updatedNextDueDate: nextDue,
                updatedLastExecuted: todayStr,
                updatedTotalExecuted: totalExecuted,
            });
        }
    }

    return results;
}

// ─── Describe when next occurrence is ────────────────────────────────────────

export function describeNextDue(nextDueDate: string, todayStr: string): string {
    if (nextDueDate === todayStr) return 'Due today';
    if (nextDueDate < todayStr) return 'Overdue';

    const days = Math.round(
        (parseISO(nextDueDate).getTime() - parseISO(todayStr).getTime()) / 86_400_000,
    );
    if (days === 1) return 'Due tomorrow';
    if (days < 7) return `Due in ${days} days`;
    if (days < 30) return `Due in ${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
    return `Due in ${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
}