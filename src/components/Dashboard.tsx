import React from 'react';
import { useStore } from '../store';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { salesLog, operatingCosts, employees, profile } = useStore();

  const totalRevenue = salesLog.reduce((acc, sale) => acc + sale.sellingPricePerUnit, 0);
  
  const totalCostOfGoods = salesLog.reduce((acc, sale) => acc + sale.trueUnitCost, 0);
  
  const totalOperatingCosts = operatingCosts.reduce((acc, cost) => acc + cost.amount, 0);
  const totalStaffCost = employees.reduce((acc, emp) => acc + emp.salary + emp.allowances, 0);

  const netProfit = totalRevenue - (totalCostOfGoods + totalOperatingCosts + totalStaffCost + profile.ownerSalary);
  
  const isSmallCompany = totalRevenue < 100000000;
  
  let estimatedTax = 0;
  if (!isSmallCompany) {
    // 30% CIT + 4% Dev Levy based on Net Profit 
    estimatedTax = Math.max(0, netProfit * 0.34);
  }

  return (
    <div className="card mb-4 mt-8 pb-12">
      <div className="flex items-center gap-2 mb-8">
        <Activity size={28} color="var(--color-wise-green)" />
        <h3 className="card-title">{profile.name} - Command Center</h3>
      </div>

      <div className="flex-col gap-6" style={{ textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--color-near-black)', padding: '24px', borderRadius: '24px', color: 'var(--color-white)', textAlign: 'center' }}>
          <p className="body-light" style={{ fontSize: '16px', color: 'var(--color-gray)' }}>Net Profit</p>
          <h2 className="display-hero" style={{ fontSize: 'clamp(2rem, 8vw, 64px)', color: netProfit >= 0 ? 'var(--color-wise-green)' : 'var(--color-sentiment-danger)' }}>
            ₦{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(14,15,12,0.12)', textAlign: 'center' }}>
          <p className="body-light" style={{ fontSize: '16px', color: 'var(--color-gray)' }}>Total Revenue</p>
          <h2 className="display-mega" style={{ fontSize: 'clamp(2.2rem, 10vw, 78px)' }}>
            ₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div style={{ backgroundColor: isSmallCompany ? 'var(--color-subtle-green)' : 'var(--color-light-surface)', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
          <div className="flex justify-between items-start mb-2" style={{ justifyContent: 'center', gap: '12px' }}>
            <p className="body-light" style={{ fontSize: '16px', color: 'var(--color-near-black)' }}>Estimated Tax Limit</p>
            {isSmallCompany ? (
              <span style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-sentiment-positive)', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                <ShieldCheck size={14} className="mr-1" /> Exempt
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-sentiment-danger)', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                <AlertTriangle size={14} className="mr-1" /> Active
              </span>
            )}
          </div>
          
          <h2 className="display-hero" style={{ fontSize: 'clamp(2rem, 8vw, 64px)' }}>
            ₦{estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          {isSmallCompany ? (
            <p className="body-light mt-4" style={{ fontSize: '14px', color: 'var(--color-sentiment-positive)' }}>0% CIT (Turnover &lt; ₦100M — NTA 2025 rule)</p>
          ) : (
            <p className="body-light mt-4" style={{ fontSize: '14px', color: 'var(--color-sentiment-danger)' }}>30% CIT + 4% Dev Levy Applied</p>
          )}
        </div>
      </div>
    </div>
  );
};
