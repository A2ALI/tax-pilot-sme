import React from 'react';
import { useStore } from '../store';
import { Activity, Download, AlertTriangle, Info } from 'lucide-react';
import * as Papa from 'papaparse';

export const Dashboard: React.FC = () => {
  const { profile, salesLog } = useStore();

  const totalRevenue = salesLog.reduce((acc, sale) => acc + sale.sellingPrice, 0);
  const totalCostOfGoods = salesLog.reduce(
    (acc, sale) => acc + (sale.purchasePrice + sale.transportCost + sale.laborCost) / sale.quantity, 
    0
  );
  const grossProfit = totalRevenue - totalCostOfGoods;

  const totalExpenses = profile.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalStaffCost = profile.employees.reduce((acc, emp) => acc + emp.salary + emp.allowances, 0);

  const netProfit = grossProfit - totalExpenses - totalStaffCost;

  const exportCSV = () => {
    const csvData = salesLog.map(sale => ({
      Date: new Date(sale.saleDate).toLocaleDateString(),
      Item: sale.name,
      Category: sale.category,
      TotalCost: ((sale.purchasePrice + sale.transportCost + sale.laborCost) / sale.quantity).toFixed(2),
      SoldPrice: sale.sellingPrice.toFixed(2),
      Profit: sale.profit.toFixed(2),
      VATCollected: sale.vatCollected.toFixed(2),
    }));

    const csvStr = Papa.unparse(csvData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'IRS_Tax_Export_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card mb-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={28} color="var(--color-wise-green)" />
        <h3 className="card-title">Live Business Health</h3>
      </div>

      <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-light-surface)', padding: '16px', borderRadius: '16px' }}>
          <p className="body-light" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>Net Profit</p>
          <h2 className="display-hero" style={{ fontSize: '32px', color: netProfit >= 0 ? 'var(--color-sentiment-positive)' : 'var(--color-sentiment-danger)' }}>
            ₦{netProfit.toFixed(2)}
          </h2>
        </div>
        
        <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-light-surface)', padding: '16px', borderRadius: '16px' }}>
          <p className="body-light" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>Total Revenue</p>
          <h2 className="display-hero" style={{ fontSize: '32px' }}>
            ₦{totalRevenue.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="mb-4" style={{ border: '1px solid var(--color-wise-green)', borderRadius: '16px', padding: '16px', backgroundColor: 'var(--color-subtle-green)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle color="var(--color-dark-green)" />
          <strong>Compliance Status</strong>
        </div>
        {profile.isSmallCompany ? (
          <div>
            <p><strong>Status: Small Company (0% CIT).</strong> You pay NO income tax this year!</p>
            <p className="body-light mt-2" style={{ fontSize: '14px', color: 'var(--color-sentiment-danger)' }}>Reminder: You must file your 'Zero-Tax' Information Return by June 30th.</p>
          </div>
        ) : (
          <p>Status: Standard Company. Corporate Income Tax applicable based on adjusted profit.</p>
        )}
      </div>

      <div className="mb-4" style={{ border: '1px solid rgba(14,15,12,0.12)', borderRadius: '16px', padding: '16px' }}>
        <div className="flex items-center gap-2 mb-2">
          <Info color="var(--color-sentiment-danger)" />
          <strong>Anti-Scam Fact</strong>
        </div>
        <p className="body-light">"Fact: Shop rent does NOT carry VAT."</p>
      </div>

      <button className="btn btn-primary" onClick={exportCSV}>
        <Download size={20} className="mr-2" /> Export Audit CSV
      </button>
    </div>
  );
};
