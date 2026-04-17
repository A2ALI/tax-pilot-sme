import React from 'react';
import { useStore } from '../store';
import { Users, AlertCircle } from 'lucide-react';

export const StaffModule: React.FC = () => {
    const { profile } = useStore();

    if (profile.employees.length === 0) return null;

    return (
        <div className="card mb-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
                <Users size={28} />
                <h3 className="card-title">Staff & Owner Ledger</h3>
            </div>

            <div className="mb-4" style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '10px' }}>
                <strong>Owner's Corner</strong>
                <p className="body-light mt-2" style={{ fontSize: '14px' }}>
                    Advice: "Paying yourself a formal salary reduces your business's taxable profit legally!"
                </p>
            </div>

            <div className="flex-col gap-4">
                {profile.employees.map(emp => {
                    const totalAnnual = (emp.salary + emp.allowances) * 12;
                    const isTaxFree = totalAnnual < 800000;

                    return (
                        <div key={emp.id} style={{ borderBottom: '1px solid var(--color-light-surface)', paddingBottom: '16px' }}>
                            <div className="flex justify-between items-center">
                                <strong>{emp.name}</strong>
                                <span>Monthly: ₦{(emp.salary + emp.allowances).toLocaleString()}</span>
                            </div>
                            
                            <div className="mt-2" style={{ fontSize: '14px' }}>
                                {isTaxFree ? (
                                    <span style={{ color: 'var(--color-sentiment-positive)', fontWeight: 'bold' }}>
                                        ★ 100% Tax-Free Zone (Under ₦800k Annual limit)
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2" style={{ color: 'var(--color-sentiment-warning)' }}>
                                        <AlertCircle size={16} />
                                        <span>Note: Above the tax-free limit. You should deduct PAYE tax.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
