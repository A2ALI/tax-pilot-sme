import React from 'react';
import { useStore } from '../store';
import { Bot, ChevronRight } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { onboardingStep, setOnboardingStep, profile, updateProfile, setActiveTab } = useStore();

  const handleNext = () => setOnboardingStep(onboardingStep + 1);

  const finishOnboarding = () => {
    setOnboardingStep(99);
    setActiveTab('Dashboard');
  };

  return (
    <div className="card mb-4 mt-8" style={{ maxWidth: '600px', margin: '32px auto' }}>
      <div className="flex items-center gap-2 mb-4">
        <Bot size={32} color="var(--color-wise-green)" />
        <h2 className="display-hero" style={{ fontSize: '40px' }}>Setup</h2>
      </div>

      {onboardingStep === 1 && (
        <div className="flex-col gap-4">
          <h3 className="card-title">Business Name</h3>
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
          <h3 className="card-title">Registration</h3>
          <p className="body-light">Are you formally registered with the CAC or do you have a TIN?</p>
          
          <div className="flex gap-2 mt-4">
            <button className={`btn ${profile.isRegistered === true ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => { updateProfile({ isRegistered: true }); handleNext(); }}>
              Registered (CAC/TIN)
            </button>
            <button className={`btn ${profile.isRegistered === false ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => { updateProfile({ isRegistered: false }); handleNext(); }}>
              Not Registered
            </button>
          </div>
        </div>
      )}

      {onboardingStep === 3 && (
        <div className="flex-col gap-4">
          <h3 className="card-title">Location</h3>
          <p className="body-light">Where do you operate from?</p>
          
          <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => { updateProfile({ locationType: 'Physical Shop', ownershipType: 'Owned' }); handleNext(); }}>
              Physical Shop (Owned)
            </button>
            <button className="btn btn-secondary" onClick={() => { updateProfile({ locationType: 'Physical Shop', ownershipType: 'Rented' }); handleNext(); }}>
              Physical Shop (Rented)
            </button>
            <button className="btn btn-secondary" onClick={() => { updateProfile({ locationType: 'Online Only', ownershipType: null }); handleNext(); }}>
              Online Only
            </button>
          </div>
        </div>
      )}

      {onboardingStep === 4 && (
        <div className="flex-col gap-4">
          <h3 className="card-title">Delivery</h3>
          <p className="body-light">Do you offer delivery to your customers?</p>
          
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={() => { updateProfile({ offersDelivery: true }); finishOnboarding(); }}>
              Offers Delivery
            </button>
            <button className="btn btn-secondary" onClick={() => { updateProfile({ offersDelivery: false }); finishOnboarding(); }}>
              No Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
