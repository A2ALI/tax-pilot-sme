import React from 'react';
import { useStore } from '../store';
import { ShieldAlert, Download, Lightbulb, BookOpen, ClipboardList } from 'lucide-react';
import * as Papa from 'papaparse';

const CIT_THRESHOLD = 100_000_000; // ₦100M — NTA 2025

const TAX_RATES = [
  { tax: 'CIT — Small Company', rate: '0%', threshold: 'Annual turnover < ₦100,000,000', basis: 'On Net Profit', color: '#054d28' },
  { tax: 'CIT — Medium / Large', rate: '30%', threshold: 'Annual turnover ≥ ₦100,000,000', basis: 'On Net Profit', color: '#d03238' },
  { tax: 'Education / Dev Levy', rate: '4%', threshold: 'Applied alongside CIT (above ₦100M)', basis: 'On Net Profit', color: '#d03238' },
  { tax: 'VAT — Basic Food', rate: '0%', threshold: 'Always zero-rated (bread, rice, yam…)', basis: 'Per sale', color: '#054d28' },
  { tax: 'VAT — Medicine & Books', rate: '0%', threshold: 'Always zero-rated', basis: 'Per sale', color: '#054d28' },
  { tax: 'VAT — General Goods', rate: '7.5%', threshold: 'Only if turnover ≥ ₦100,000,000', basis: 'Per sale', color: '#d03238' },
  { tax: 'PAYE — Tax-Free Band', rate: '0%', threshold: 'Annual gross ≤ ₦800,000', basis: 'Monthly salary', color: '#054d28' },
  { tax: 'PAYE — Band 1', rate: '7%', threshold: 'First ₦300,000 of taxable income', basis: 'Annual taxable after CRA', color: '#868685' },
  { tax: 'PAYE — Band 2', rate: '11%', threshold: 'Next ₦300,000', basis: 'Annual taxable after CRA', color: '#868685' },
  { tax: 'PAYE — Band 3', rate: '15%', threshold: 'Next ₦500,000', basis: 'Annual taxable after CRA', color: '#868685' },
  { tax: 'PAYE — Band 4', rate: '19%', threshold: 'Next ₦500,000', basis: 'Annual taxable after CRA', color: '#868685' },
  { tax: 'PAYE — Band 5', rate: '21%', threshold: 'Next ₦1,600,000', basis: 'Annual taxable after CRA', color: '#868685' },
  { tax: 'PAYE — Top Band', rate: '24%', threshold: 'Income above ₦3,200,000', basis: 'Annual taxable after CRA', color: '#c04020' },
  { tax: 'CRA (Relief Allowance)', rate: '20% of gross + ₦200,000', threshold: 'Applied before PAYE calculation', basis: 'Annual gross', color: '#054d28' },
];

function fmtNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

const CATEGORY_BADGE: Record<string, { bg: string; color: string }> = {
  'Basic Food':      { bg: 'rgba(5,77,40,0.12)',  color: '#054d28' },
  'Medicine/Books':  { bg: 'rgba(0,90,110,0.12)', color: '#00607a' },
  'General Goods':   { bg: 'rgba(208,50,56,0.10)', color: '#d03238' },
};

export const CompliancePage: React.FC = () => {
  const { salesLog } = useStore();

  const totalRevenue = salesLog.reduce((acc, sale) => acc + sale.sellingPricePerUnit, 0);
  const isSmallCompany = totalRevenue < CIT_THRESHOLD;

  const generalGoodsSold = salesLog.some(sale => sale.category === 'General Goods');
  const vatTriggered = generalGoodsSold && !isSmallCompany;

  // Sort newest → oldest
  const sortedSales = [...salesLog].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );

  // Ledger totals
  const totalCost    = salesLog.reduce((a, s) => a + s.trueUnitCost, 0);
  const totalProfit  = salesLog.reduce((a, s) => a + s.profit, 0);
  const totalVAT     = salesLog.reduce((a, s) => a + s.vatCollected, 0);

  const exportCSV = () => {
    const csvData = sortedSales.map(sale => ({
      Date:     fmtDate(sale.saleDate),
      Item:     sale.name,
      Category: sale.category,
      Type:     sale.entryType,
      'True Cost (₦)':    sale.trueUnitCost.toFixed(2),
      'Revenue (₦)':      sale.sellingPricePerUnit.toFixed(2),
      'Profit (₦)':       sale.profit.toFixed(2),
      'VAT Collected (₦)': sale.vatCollected.toFixed(2),
    }));

    const csvStr = Papa.unparse(csvData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TaxPilot_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ─── shared table cell style ─── */
  const th: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-gray)',
    borderBottom: '2px solid var(--color-light-surface)',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '14px',
    borderBottom: '1px solid var(--color-light-surface)',
    whiteSpace: 'nowrap',
  };
  const tdRight: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div className="pb-16 mt-8">

      {/* ── 1. VAT Compliance Status ── */}
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={28} />
          <h3 className="card-title">VAT Compliance Status</h3>
        </div>

        {vatTriggered ? (
          <div style={{ backgroundColor: 'rgba(208,50,56,0.1)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-sentiment-danger)' }}>
            <p className="body-light" style={{ color: 'var(--color-sentiment-danger)', fontWeight: 'bold' }}>
              VAT ACTIVE: 7.5% Surcharge Triggered
            </p>
            <p className="body-light mt-2" style={{ fontSize: '14px' }}>
              Your turnover exceeds ₦100M and you sell General Goods. You must remit 7.5% VAT on these items to FIRS.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-wise-green)' }}>
            <p className="body-light" style={{ color: 'var(--color-sentiment-positive)', fontWeight: 'bold' }}>
              VAT EXEMPT (Currently Safe)
            </p>
            <p className="body-light mt-2" style={{ fontSize: '14px' }}>
              {isSmallCompany
                ? 'You are below the ₦100M threshold. All sales are VAT exempt.'
                : 'You do not sell General Goods. Basic Food and Medicine are zero-rated.'}
            </p>
          </div>
        )}
      </div>

      {/* ── 2. Tax Rates & Thresholds Reference ── */}
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={28} color="var(--color-wise-green)" />
          <h3 className="card-title">Tax Rates & Thresholds</h3>
        </div>
        <p className="body-light mb-4" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>
          All rates enforced by this system. Based on Nigerian Finance Act 2019–2023 and NTA 2025 guidance.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-light-surface)' }}>
                <th style={th}>Tax / Relief</th>
                <th style={{ ...th, textAlign: 'right' }}>Rate</th>
                <th style={th}>Trigger / Threshold</th>
                <th style={th}>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {TAX_RATES.map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(14,15,12,0.02)' }}>
                  <td style={{ ...td, fontWeight: 600 }}>{row.tax}</td>
                  <td style={{ ...tdRight }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '999px',
                      backgroundColor: `${row.color}18`,
                      color: row.color,
                      fontWeight: 700,
                      fontSize: '13px',
                    }}>
                      {row.rate}
                    </span>
                  </td>
                  <td style={{ ...td, color: 'var(--color-gray)', fontSize: '13px', whiteSpace: 'normal', minWidth: '200px' }}>{row.threshold}</td>
                  <td style={{ ...td, color: 'var(--color-gray)', fontSize: '13px' }}>{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Sales Ledger ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList size={28} color="var(--color-wise-green)" />
          <h3 className="card-title">Sales Ledger</h3>
        </div>
        <p className="body-light mb-4" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>
          Full record of all transactions — newest first. Export to CSV for FIRS submission.
        </p>

        {sortedSales.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p className="body-light" style={{ color: 'var(--color-gray)', fontSize: '15px' }}>
              No sales recorded yet. Mark items as sold in Inventory to build your ledger.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--color-light-surface)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-near-black)' }}>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none' }}>Date</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none' }}>Item</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none' }}>Category</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none' }}>Type</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none', textAlign: 'right' }}>True Cost</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none', textAlign: 'right' }}>Revenue</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none', textAlign: 'right' }}>Profit</th>
                    <th style={{ ...th, color: '#9fe870', borderBottom: 'none', textAlign: 'right' }}>VAT Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((sale, i) => {
                    const catStyle = CATEGORY_BADGE[sale.category] ?? { bg: '#eee', color: '#333' };
                    const isProfit = sale.profit >= 0;
                    return (
                      <tr
                        key={sale.id}
                        style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(14,15,12,0.02)' }}
                      >
                        <td style={{ ...td, fontSize: '13px', color: 'var(--color-gray)' }}>{fmtDate(sale.saleDate)}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{sale.name}</td>
                        <td style={td}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                            fontSize: '12px',
                            fontWeight: 700,
                          }}>
                            {sale.category}
                          </span>
                        </td>
                        <td style={td}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: sale.entryType === 'Bulk' ? 'rgba(159,232,112,0.2)' : 'rgba(14,15,12,0.06)',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}>
                            {sale.entryType}
                          </span>
                        </td>
                        <td style={tdRight}>{fmtNaira(sale.trueUnitCost)}</td>
                        <td style={tdRight}>{fmtNaira(sale.sellingPricePerUnit)}</td>
                        <td style={{ ...tdRight, color: isProfit ? 'var(--color-sentiment-positive)' : 'var(--color-sentiment-danger)', fontWeight: 700 }}>
                          {isProfit ? '+' : ''}{fmtNaira(sale.profit)}
                        </td>
                        <td style={{ ...tdRight, color: sale.vatCollected > 0 ? 'var(--color-sentiment-danger)' : 'var(--color-gray)' }}>
                          {fmtNaira(sale.vatCollected)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* ── Totals footer ── */}
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--color-near-black)', color: 'var(--color-white)' }}>
                    <td style={{ ...td, color: 'var(--color-wise-green)', fontWeight: 700, borderBottom: 'none' }} colSpan={4}>
                      TOTALS ({salesLog.length} sales)
                    </td>
                    <td style={{ ...tdRight, color: 'var(--color-white)', fontWeight: 700, borderBottom: 'none' }}>{fmtNaira(totalCost)}</td>
                    <td style={{ ...tdRight, color: 'var(--color-white)', fontWeight: 700, borderBottom: 'none' }}>{fmtNaira(totalRevenue)}</td>
                    <td style={{ ...tdRight, color: totalProfit >= 0 ? '#9fe870' : 'var(--color-sentiment-danger)', fontWeight: 700, borderBottom: 'none' }}>
                      {totalProfit >= 0 ? '+' : ''}{fmtNaira(totalProfit)}
                    </td>
                    <td style={{ ...tdRight, color: totalVAT > 0 ? 'var(--color-sentiment-danger)' : 'var(--color-gray)', fontWeight: 700, borderBottom: 'none' }}>
                      {fmtNaira(totalVAT)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── CSV Export — below the ledger ── */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={exportCSV} style={{ gap: '8px' }}>
                <Download size={18} />
                Download CSV Ledger ({salesLog.length} records)
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 4. Anti-Scam Facts ── */}
      <div className="card" style={{ backgroundColor: 'var(--color-near-black)', color: 'var(--color-white)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={28} color="var(--color-sentiment-warning)" />
          <h3 className="card-title">Anti-Scam Facts</h3>
        </div>
        <ul className="body-light" style={{ marginLeft: '20px', lineHeight: '2' }}>
          <li><strong>Fact:</strong> Shop rent does NOT carry VAT.</li>
          <li><strong>Fact:</strong> Basic food (Bread, Rice, Yam) is 0% VAT regardless of your turnover.</li>
          <li><strong>Fact:</strong> A TIN is 100% Free. Do not pay an agent to generate it.</li>
          <li><strong>Fact:</strong> Small companies (under ₦100M turnover) pay 0% CIT — legally.</li>
        </ul>
      </div>

    </div>
  );
};
