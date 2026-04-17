import React from 'react';
import { useStore } from '../store';
import { Bot, ChevronRight, Check } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { onboardingStep, setOnboardingStep, profile, updateProfile, addExpense, addEmployee } = useStore();

  const handleNext = () => setOnboardingStep(onboardingStep + 1);

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={32} color="var(--color-wise-green)" />
          <h2 className="display-hero" style={{ fontSize: '40px' }}>Setup</h2>
        </div>

        {onboardingStep === 1 && (
          <div className="flex-col gap-4">
            <p className="body-light">Welcome! Let's get your business tax-ready. What's your business name?</p>
            <input 
              className="input-field mt-2" 
              value={profile.name} 
              onChange={e => updateProfile({ name: e.target.value })} 
              placeholder="e.g. My Market Shop"
            />
            <div className="mt-4">
              <button className="btn btn-primary" onClick={handleNext}>
                Continue <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="flex-col gap-4">
            <h3 className="card-title">Formalization</h3>
            <p className="body-light">Do you have a CAC Registration or a TIN (Tax Identification Number)?</p>
            
            <div style={{ padding: '16px', backgroundColor: 'var(--color-subtle-green)', borderRadius: '10px', marginTop: '16px' }}>
              <strong style={{ color: 'var(--color-sentiment-positive)' }}>💡 Educational Tip:</strong>
              <p className="body-light mt-2" style={{ fontSize: '14px' }}>
                A TIN is like your business's National ID. It's free and required for opening a business bank account!
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={() => { updateProfile({ hasTIN: true }); handleNext(); }}>Yes, I have it</button>
              <button className="btn btn-secondary" onClick={() => { updateProfile({ hasTIN: false }); handleNext(); }}>Not yet</button>
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="flex-col gap-4">
            <h3 className="card-title">Threshold Check</h3>
            <p className="body-light">In 2026, is your total business value (Stock + Cash + Assets) less than ₦50 Million?</p>
            
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={() => { updateProfile({ isSmallCompany: true }); handleNext(); }}>Yes, Under ₦50M</button>
              <button className="btn btn-secondary" onClick={() => { updateProfile({ isSmallCompany: false }); handleNext(); }}>No, Over ₦50M</button>
            </div>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="flex-col gap-4">
            <h3 className="card-title">Deductibles (Expenses)</h3>
            <p className="body-light">Do you pay Rent, Electricity, or Water for your shop?</p>
            
            <button className="btn btn-secondary mt-2" onClick={() => addExpense('Rent', 50000)}>+ Add Typical Rent (₦50k)</button>
            <button className="btn btn-secondary mt-2 ml-2" onClick={() => addExpense('Utility', 5000)}>+ Add Utility (₦5k)</button>
            
            <div className="mt-4">
              <button className="btn btn-primary" onClick={handleNext}>
                Next Step <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {onboardingStep === 5 && (
          <div className="flex-col gap-4">
            <h3 className="card-title">Staffing</h3>
            <p className="body-light">Do you have employees? (Exclude yourself)</p>
            
            <button className="btn btn-secondary mt-2" onClick={() => addEmployee({ id: Date.now().toString(), name: 'Staff A', salary: 30000, allowances: 5000 })}>
              + Add Example Staff (₦30k)
            </button>
            
            <div className="mt-4">
              <button className="btn btn-primary" onClick={() => setOnboardingStep(99)}> {/* Done */}
                Finish Onboarding <Check className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
