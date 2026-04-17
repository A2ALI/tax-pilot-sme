import React, { useState } from 'react';
import { useStore } from '../store';
import { Receipt, Users, PlusCircle, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

function calculateMonthlyPAYE(monthlyGross: number): number {
  const annual = monthlyGross * 12;
  if (annual <= 800000) return 0;
  
  const cra = 200000 + (0.20 * annual);
  let taxable = annual - cra;
  if (taxable <= 0) return 0;

  let annualTax = 0;
  if (taxable > 300000) { annualTax += 300000 * 0.07; taxable -= 300000; } else { annualTax += taxable * 0.07; return annualTax / 12; }
  if (taxable > 300000) { annualTax += 300000 * 0.11; taxable -= 300000; } else { annualTax += taxable * 0.11; return annualTax / 12; }
  if (taxable > 500000) { annualTax += 500000 * 0.15; taxable -= 500000; } else { annualTax += taxable * 0.15; return annualTax / 12; }
  if (taxable > 500000) { annualTax += 500000 * 0.19; taxable -= 500000; } else { annualTax += taxable * 0.19; return annualTax / 12; }
  if (taxable > 1600000) { annualTax += 1600000 * 0.21; taxable -= 1600000; } else { annualTax += taxable * 0.21; return annualTax / 12; }
  annualTax += taxable * 0.24;
  
  return annualTax / 12;
}

export const DeductiblesPage: React.FC = () => {
  const { employees, addEmployee, operatingCosts, addOperatingCost, profile, updateProfile } = useStore();

  const [staffName, setStaffName] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [allowances, setAllowances] = useState<number | ''>('');

  const [costType, setCostType] = useState('Rent');
  const [costAmount, setCostAmount] = useState<number | ''>('');

  const [ownerSalaryInput, setOwnerSalaryInput] = useState<number | ''>(profile.ownerSalary || '');
  const [savedOwner, setSavedOwner] = useState(false);

  const handleAddStaff = () => {
    const numSalary = Number(salary) || 0;
    const numAllow = Number(allowances) || 0;
    if (!staffName || numSalary <= 0) return;
    
    addEmployee({ id: Date.now().toString(), name: staffName, salary: numSalary, allowances: numAllow });
    setStaffName(''); setSalary(''); setAllowances('');
  };

  const handleAddOpEx = () => {
    const numCost = Number(costAmount) || 0;
    if (numCost <= 0) return;
    
    addOperatingCost({ id: Date.now().toString(), type: costType, amount: numCost });
    setCostType('Rent'); setCostAmount('');
  };

  const handleSaveOwnerSalary = () => {
    const numSalary = Number(ownerSalaryInput) || 0;
    updateProfile({ ownerSalary: numSalary });
    setSavedOwner(true);
    setTimeout(() => setSavedOwner(false), 2000);
  };

  const ownerPAYE = calculateMonthlyPAYE(Number(profile.ownerSalary) || 0);

  return (
    <div className="pb-16 mt-8">
      {/* Owner Salary */}
      <div className="card mb-8" style={{ border: '2px solid var(--color-wise-green)' }}>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={28} color="var(--color-wise-green)" />
          <h3 className="card-title">Owner's Corner</h3>
        </div>
        
        <div style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
          <strong>💡 Optimal Profit Guide</strong>
          <p className="body-light mt-1" style={{ fontSize: '14px' }}>
            It is universally recommended that you pay yourself a formal, fixed monthly salary (typically <strong>20% to 30%</strong> of projected Net Profit) rather than dipping randomly into the business cash flow. This legally reduces the business's taxable profit!
          </p>
        </div>

        <div className="flex-col gap-4">
          <div>
             <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Monthly Owner Salary (₦)</label>
             <input type="number" className="input-field" placeholder="e.g. 150000" value={ownerSalaryInput} onChange={e => setOwnerSalaryInput(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          
          <button className={`btn ${savedOwner ? 'btn-secondary' : 'btn-primary'} mt-2`} onClick={handleSaveOwnerSalary}>
            <CheckCircle2 size={20} className="mr-2" color={savedOwner ? 'var(--color-sentiment-positive)' : 'currentColor'} /> 
            {savedOwner ? 'Salary Saved & Deducted!' : 'Save Owner Salary'}
          </button>
        </div>

        {/* Live Owner Tax Calculation */}
        {profile.ownerSalary > 0 && (
          <div className="mt-4" style={{ backgroundColor: 'var(--color-near-black)', color: 'var(--color-white)', padding: '16px', borderRadius: '10px' }}>
            <div className="flex justify-between mb-2">
              <span>Active Owner Salary:</span>
              <strong>₦{profile.ownerSalary.toLocaleString()} /mo</strong>
            </div>
            <div className="flex justify-between" style={{ color: ownerPAYE === 0 ? 'var(--color-wise-green)' : 'var(--color-sentiment-danger)' }}>
              <span>Auto-Calculated PAYE Tax:</span>
              <strong>₦{ownerPAYE.toLocaleString(undefined, { maximumFractionDigits: 2 })} /mo</strong>
            </div>
          </div>
        )}
      </div>

      {/* Operating Costs Section */}
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={28} />
          <h3 className="card-title">Operating Costs</h3>
        </div>

        <div className="flex-col gap-4 mb-6">
          <div>
            <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Cost Category</label>
            <select className="input-field" value={costType} onChange={e => setCostType(e.target.value)}>
              <option value="Rent">Rent</option>
              <option value="Electricity">Electricity</option>
              <option value="Equipment">Equipment</option>
              <option value="Delivery Fuel">Delivery Fuel</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Cost Amount (₦)</label>
            <input type="number" className="input-field" placeholder="e.g. 50000" value={costAmount} onChange={e => setCostAmount(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          
          <button className="btn btn-primary mt-2" onClick={handleAddOpEx}>
            <PlusCircle size={20} className="mr-2" /> Add Expense
          </button>
        </div>

        {operatingCosts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-light-surface)', paddingTop: '16px' }}>
            {operatingCosts.map(cost => (
              <div key={cost.id} className="flex justify-between items-center mb-2">
                <span className="body-light">{cost.type}</span>
                <span style={{ fontWeight: 'bold' }}>₦{cost.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Tracker Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={28} />
          <h3 className="card-title">Staff Tracker</h3>
        </div>

        <div className="flex-col gap-4 mb-6">
          <div>
             <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Staff Name</label>
             <input className="input-field" placeholder="e.g. John Doe" value={staffName} onChange={e => setStaffName(e.target.value)} />
          </div>
          
          <div>
             <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Monthly Salary (₦)</label>
             <input type="number" className="input-field" placeholder="0" value={salary} onChange={e => setSalary(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          
          <div>
             <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Other Allowances (Feeding / Transport) ₦</label>
             <input type="number" className="input-field" placeholder="0" value={allowances} onChange={e => setAllowances(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          
          <button className="btn btn-secondary mt-2" onClick={handleAddStaff}>
            <PlusCircle size={20} className="mr-2" /> Add Staff Member
          </button>
        </div>

        {employees.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-light-surface)', paddingTop: '16px' }}>
            {employees.map(emp => {
              const totalMonthly = emp.salary + emp.allowances;
              const isTaxFree = totalMonthly < 66667;
              const staffPAYE = calculateMonthlyPAYE(totalMonthly);

              return (
                <div key={emp.id} className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--color-light-surface)' }}>
                  <div className="flex justify-between items-center">
                    <strong>{emp.name}</strong>
                    <span>₦{(totalMonthly).toLocaleString()} /mo</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {isTaxFree ? (
                      <span style={{ backgroundColor: 'var(--color-sentiment-positive)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Tax-Free (&lt; ₦66,667 threshold)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={16} color="var(--color-sentiment-warning)" />
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-sentiment-warning)' }}>
                          PAYE: ₦{staffPAYE.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
