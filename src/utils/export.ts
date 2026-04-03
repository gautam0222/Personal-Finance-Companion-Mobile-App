import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { AppSettings, Goal, Transaction } from '../types';
import { format } from 'date-fns';

export type ExportFormat = 'json' | 'csv' | 'pdf';

// ─── JSON ──────────────────────────────────────────────────────────────────────

export async function exportAsJSON(
  settings: AppSettings,
  transactions: Transaction[],
  goals: Goal[],
): Promise<void> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const uri = `${FileSystem.cacheDirectory}flo-export-${ts}.json`;

  const payload = {
    app: 'Flo Finance',
    exportedAt: new Date().toISOString(),
    settings,
    transactions,
    goals,
  };

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await shareFile(uri, 'application/json', 'public.json');
}

// ─── CSV ───────────────────────────────────────────────────────────────────────

export async function exportAsCSV(
  settings: AppSettings,
  transactions: Transaction[],
): Promise<void> {
  const header = 'Date,Type,Category,Amount,Currency,Note\n';
  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => {
      const safe = (s: string) => `"${s.replace(/"/g, '""')}"`;
      return [
        t.date,
        t.type,
        safe(t.category),
        t.amount.toFixed(2),
        settings.currency,
        safe(t.note || ''),
      ].join(',');
    })
    .join('\n');

  const csv = header + rows;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const uri = `${FileSystem.cacheDirectory}flo-transactions-${ts}.csv`;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await shareFile(uri, 'text/csv', 'public.comma-separated-values-text');
}

// ─── PDF ───────────────────────────────────────────────────────────────────────

export async function exportAsPDF(
  settings: AppSettings,
  transactions: Transaction[],
  goals: Goal[],
): Promise<void> {
  const sym = settings.currencySymbol;
  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const txRows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (t) => `
      <tr>
        <td>${t.date}</td>
        <td><span class="${t.type}">${t.type === 'income' ? '▲' : '▼'} ${t.type}</span></td>
        <td>${t.category}</td>
        <td class="amount ${t.type}">${sym}${t.amount.toFixed(2)}</td>
        <td>${t.note || '—'}</td>
      </tr>`,
    )
    .join('');

  const goalRows = goals
    .map(
      (g) => `
      <tr>
        <td>${g.title}</td>
        <td>${sym}${g.currentAmount.toFixed(0)} / ${sym}${g.targetAmount.toFixed(0)}</td>
        <td>${Math.round((g.currentAmount / g.targetAmount) * 100)}%</td>
        <td>${g.isCompleted ? '✅ Done' : g.isActive ? '🟢 Active' : '⏸ Paused'}</td>
      </tr>`,
    )
    .join('');

  const html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; padding: 40px; }
      .header { text-align: center; margin-bottom: 32px; }
      .header h1 { font-size: 28px; color: #7C3AED; margin-bottom: 4px; }
      .header p { color: #888; font-size: 12px; }
      .summary { display: flex; gap: 16px; margin-bottom: 32px; }
      .stat { flex: 1; background: #f8f7ff; border-radius: 12px; padding: 16px; text-align: center; }
      .stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
      .stat .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
      .stat .value.income { color: #10b981; }
      .stat .value.expense { color: #ef4444; }
      .stat .value.balance { color: #7C3AED; }
      h2 { font-size: 16px; margin: 24px 0 12px; color: #7C3AED; border-bottom: 2px solid #ede9fe; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #7C3AED; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
      td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
      tr:nth-child(even) { background: #faf9ff; }
      .income { color: #10b981; }
      .expense { color: #ef4444; }
      .amount { font-weight: 600; font-variant-numeric: tabular-nums; }
      .footer { text-align: center; margin-top: 40px; color: #bbb; font-size: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>✦ Flo Finance</h1>
      <p>Financial Report — ${format(new Date(), 'MMMM d, yyyy')}</p>
      <p>Exported by ${settings.userName || 'User'}</p>
    </div>

    <div class="summary">
      <div class="stat">
        <div class="label">Balance</div>
        <div class="value balance">${sym}${(totalIncome - totalExpense).toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="label">Income</div>
        <div class="value income">+${sym}${totalIncome.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="label">Expenses</div>
        <div class="value expense">-${sym}${totalExpense.toFixed(2)}</div>
      </div>
    </div>

    <h2>Transactions (${transactions.length})</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th></tr>
      </thead>
      <tbody>${txRows || '<tr><td colspan="5" style="text-align:center;color:#aaa;">No transactions</td></tr>'}</tbody>
    </table>

    ${goals.length > 0 ? `
    <h2>Goals (${goals.length})</h2>
    <table>
      <thead>
        <tr><th>Title</th><th>Progress</th><th>%</th><th>Status</th></tr>
      </thead>
      <tbody>${goalRows}</tbody>
    </table>
    ` : ''}

    <div class="footer">
      Generated by Flo Finance • ${new Date().toISOString()}
    </div>
  </body>
  </html>`;

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, 'application/pdf', 'com.adobe.pdf');
}

// ─── Shared helper ─────────────────────────────────────────────────────────────

async function shareFile(uri: string, mimeType: string, uti: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType,
      UTI: uti,
      dialogTitle: 'Export Flo Finance data',
    });
  }
}
