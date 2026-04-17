import React from 'react';
import { useStore, type TabName } from '../store';
import { LayoutDashboard, PackageSearch, Receipt, ShieldCheck } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, onboardingStep } = useStore();

  if (onboardingStep < 99) return null;

  const tabs: { name: TabName, icon: React.ReactNode }[] = [
    { name: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { name: 'Inventory', icon: <PackageSearch size={24} /> },
    { name: 'Deductibles', icon: <Receipt size={24} /> },
    { name: 'Compliance', icon: <ShieldCheck size={24} /> },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--color-white)',
      borderTop: '1px solid rgba(14,15,12,0.12)',
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--color-dark-green)' : 'var(--color-gray)',
              transition: 'transform 0.2s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              padding: '8px',
              borderRadius: '16px',
              backgroundColor: isActive ? 'var(--color-wise-green)' : 'transparent'
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal', marginTop: '4px' }}>
              {tab.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
