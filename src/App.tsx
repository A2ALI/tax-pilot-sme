import React from 'react';
import { useStore } from './store';
import { OnboardingWizard } from './components/Wizard';
import { InventoryForm, InventoryList } from './components/Inventory';
import { StaffModule } from './components/Staff';
import { Dashboard } from './components/Dashboard';

function App() {
  const { onboardingStep } = useStore();

  return (
    <div className="container" style={{ paddingBottom: '64px' }}>
      <header style={{ padding: '24px 0', borderBottom: '1px solid var(--color-light-surface)', marginBottom: '24px' }}>
        <h1 className="display-hero" style={{ fontSize: '32px' }}>Tax Pilot <span style={{ color: 'var(--color-wise-green)' }}>2026</span></h1>
        <p className="body-light" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>Your Smart Accountant</p>
      </header>

      {onboardingStep < 99 ? (
        <OnboardingWizard />
      ) : (
        <div>
          <div className="flex gap-4 mb-4" style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Active Modules:</span>
            <span style={{ fontSize: '14px' }}>Smart Inventory</span>
            <span style={{ fontSize: '14px' }}>Staff Tracker</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
            <section>
              <Dashboard />
            </section>
            
            <section>
              <InventoryForm />
              <InventoryList />
            </section>
            
            <section>
              <StaffModule />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
