import React from 'react';
import { useStore } from '../store';
import { ShieldAlert, Download, Lightbulb } from 'lucide-react';
import * as Papa from 'papaparse';

export const CompliancePage: React.FC = () => {
  const { salesLog } = useStore();

  const totalRevenue = salesLog.reduce((acc, sale) => acc + sale.sellingPricePerUnit, 0);
  const isSmallCompany = totalRevenue < 50000000;

  // Check if there are any General Goods sold that trigger VAT
  const generalGoodsSold = salesLog.some(sale => sale.category === 'General Goods');
  const vatTriggered = generalGoodsSold && !isSmallCompany;

  const exportCSV = () => {
    const csvData = salesLog.map(sale => ({
      Date: new Date(sale.saleDate).toLocaleDateString(),
      Type: sale.entryType,
      Item: sale.name,
      Category: sale.category,
      Cost: sale.trueUnitCost.toFixed(2),
      Revenue: sale.sellingPricePerUnit.toFixed(2),
      Profit: sale.profit.toFixed(2),
      VAT: sale.vatCollected.toFixed(2),
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
    <div className="pb-16 mt-8">
      {/* VAT Trigger Logic Display */}
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
              Your turnover exceeds ₦50M and you sell General Goods. You must remit 7.5% VAT on these items.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-wise-green)' }}>
            <p className="body-light" style={{ color: 'var(--color-sentiment-positive)', fontWeight: 'bold' }}>
              VAT EXEMPT (Currently Safe)
            </p>
            <p className="body-light mt-2" style={{ fontSize: '14px' }}>
              {isSmallCompany ? "You are below the ₦50M threshold. All sales are VAT exempt." : "You do not sell General Goods. Basic Food and Medicine are zero-rated."}
            </p>
          </div>
        )}
      </div>

      {/* CSV Export */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Audit Export</h3>
        <p className="body-light mb-4">Export your unified ledger formatted securely for FIRS compliance.</p>
        <button className="btn btn-primary w-full" style={{ width: '100%' }} onClick={exportCSV}>
          <Download size={20} className="mr-2" /> Download CSV Ledger
        </button>
      </div>

      {/* Rotating Tips/Facts */}
      <div className="card" style={{ backgroundColor: 'var(--color-near-black)', color: 'var(--color-white)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={28} color="var(--color-sentiment-warning)" />
          <h3 className="card-title">Anti-Scam Facts</h3>
        </div>
        <ul className="body-light" style={{ marginLeft: '20px', lineHeight: '2' }}>
          <li><strong>Fact:</strong> Shop rent does NOT carry VAT.</li>
          <li><strong>Fact:</strong> Basic food (Bread, Rice, Yam) is 0% VAT regardless of your turnover.</li>
          <li><strong>Fact:</strong> A TIN is 100% Free. Do not pay an agent to generate it.</li>
        </ul>
      </div>
    </div>
  );
};
