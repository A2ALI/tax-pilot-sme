import { create } from 'zustand';

export type TabName = 'Dashboard' | 'Inventory' | 'Deductibles' | 'Compliance';

// Minimalist Onboarding Profile
interface BusinessProfile {
  name: string;
  isRegistered: boolean | null; // CAC/TIN
  locationType: 'Physical Shop' | 'Online Only' | null;
  ownershipType: 'Owned' | 'Rented' | null; // Only if Physical
  offersDelivery: boolean | null;
  ownerSalary: number;
}


interface Employee {
  id: string;
  name: string;
  salary: number; // Monthly
  allowances: number;
}

interface OperatingCost {
  id: string;
  type: 'Rent' | 'Electricity' | 'Equipment' | 'Delivery Fuel' | string;
  amount: number;
}

// Inventory Categories: Basic Food, Medicine/Books, General Goods
interface InventoryItem {
  id: string;
  category: 'Basic Food' | 'Medicine/Books' | 'General Goods';
  name: string;
  quantity: number;
  entryType: 'Bulk' | 'Single';
  purchasePricePerUnit: number;
  totalTransportCost: number; // For the entire batch
  totalLaborCost: number; // For the entire batch
  trueUnitCost: number; // Computed during add
  sellingPricePerUnit: number;
}

interface SalesLedgerItem extends InventoryItem {
  saleDate: string;
  profit: number;
  vatCollected: number;
}

interface TaxPilotState {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  onboardingStep: number;
  setOnboardingStep: (step: number) => void;

  profile: BusinessProfile;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  
  employees: Employee[];
  addEmployee: (emp: Employee) => void;
  
  operatingCosts: OperatingCost[];
  addOperatingCost: (cost: OperatingCost) => void;

  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  
  salesLog: SalesLedgerItem[];
  markAsSold: (itemId: string) => void;
}

export const useStore = create<TaxPilotState>((set) => ({
  activeTab: 'Dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  profile: {
    name: 'My Business',
    isRegistered: null,
    locationType: null,
    ownershipType: null,
    offersDelivery: null,
    ownerSalary: 0,
  },

  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates }
  })),

  employees: [],
  addEmployee: (emp) => set((state) => ({
    employees: [...state.employees, emp]
  })),

  operatingCosts: [],
  addOperatingCost: (cost) => set((state) => ({
    operatingCosts: [...state.operatingCosts, cost]
  })),

  inventory: [],
  addInventoryItem: (item) => set((state) => ({
    inventory: [...state.inventory, item]
  })),

  salesLog: [],
  markAsSold: (itemId) => set((state) => {
    const itemIdx = state.inventory.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return state;

    const item = state.inventory[itemIdx];
    
    // Profit Calculation
    const profit = item.sellingPricePerUnit - item.trueUnitCost;
    
    // Determine 50M threshold lazily based on current past sales logic
    const totalCurrentRevenue = state.salesLog.reduce((acc, sale) => acc + sale.sellingPricePerUnit, 0);
    const totalPotentialTurnover = totalCurrentRevenue + item.sellingPricePerUnit;
    const isSmallCompany = totalPotentialTurnover < 50000000;

    let vatRate = 0;
    if (item.category === 'General Goods' && !isSmallCompany) {
      vatRate = 0.075; // 7.5%
    }
    const vatCollected = item.sellingPricePerUnit * vatRate;

    const sale: SalesLedgerItem = {
      ...item,
      saleDate: new Date().toISOString(),
      profit,
      vatCollected
    };

    const newInventory = [...state.inventory];
    newInventory[itemIdx] = { ...newInventory[itemIdx], quantity: newInventory[itemIdx].quantity - 1 };
    
    if (newInventory[itemIdx].quantity <= 0) {
      newInventory.splice(itemIdx, 1);
    }

    return {
      inventory: newInventory,
      salesLog: [...state.salesLog, sale]
    };
  })
}));
