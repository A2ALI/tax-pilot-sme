import { useStore } from './store';
import { OnboardingWizard } from './components/Wizard';
import { InventoryPage } from './components/Inventory';
import { DeductiblesPage } from './components/Deductibles';
import { Dashboard } from './components/Dashboard';
import { CompliancePage } from './components/Compliance';
import { BottomNav } from './components/BottomNav';

function App() {
  const { onboardingStep, activeTab } = useStore();

  return (
    <div className="container" style={{ paddingBottom: '96px' }}>
      <header style={{ padding: '24px 0', borderBottom: '1px solid var(--color-light-surface)', marginBottom: '8px' }}>
        <h1 className="display-hero" style={{ fontSize: '32px' }}>Tax Pilot <span style={{ color: 'var(--color-wise-green)' }}>2026</span></h1>
        <p className="body-light" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>Your Smart Accountant</p>
      </header>

      {onboardingStep < 99 ? (
        <OnboardingWizard />
      ) : (
        <div>
          {activeTab === 'Dashboard' && <Dashboard />}
          {activeTab === 'Inventory' && <InventoryPage />}
          {activeTab === 'Deductibles' && <DeductiblesPage />}
          {activeTab === 'Compliance' && <CompliancePage />}
        </div>
      )}

      {onboardingStep >= 99 && <BottomNav />}
    </div>
  );
}

export default App;
