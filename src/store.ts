import { create } from 'zustand';

// Phase 1
interface BusinessProfile {
  name: string;
  hasTIN: boolean | null;
  isSmallCompany: boolean | null; // < 50M turnover
  expenses: { type: string; amount: number }[];
  employees: Employee[];
}

interface Employee {
  id: string;
  name: string;
  salary: number;
  allowances: number;
}

// Phase 2
// Inventory Categories: Basic Food, Medicine/Books, General Goods
interface InventoryItem {
  id: string;
  category: 'Basic Food' | 'Medicine/Books' | 'General Goods';
  name: string;
  quantity: number;
  purchasePrice: number;
  transportCost: number;
  laborCost: number;
  sellingPrice: number;
  // Computed: vat is 0% if Basic Food/Medicine/Books or turnover < 50M. Otherwise 7.5%
}

interface SalesLedgerItem extends InventoryItem {
  saleDate: string;
  profit: number;
  vatCollected: number;
}

interface TaxPilotState {
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;

  profile: BusinessProfile;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  addExpense: (type: string, amount: number) => void;
  addEmployee: (emp: Employee) => void;

  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  
  salesLog: SalesLedgerItem[];
  markAsSold: (itemId: string) => void;
}

export const useStore = create<TaxPilotState>((set) => ({
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  profile: {
    name: 'My Business',
    hasTIN: null,
    isSmallCompany: null,
    expenses: [],
    employees: [],
  },

  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates }
  })),

  addExpense: (type, amount) => set((state) => ({
    profile: {
      ...state.profile,
      expenses: [...state.profile.expenses, { type, amount }]
    }
  })),

  addEmployee: (emp) => set((state) => ({
    profile: {
      ...state.profile,
      employees: [...state.profile.employees, emp]
    }
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
    
    // RPA Action logic
    const unitCost = (item.purchasePrice + Math.max(0, item.transportCost) + Math.max(0, item.laborCost)) / item.quantity;
    const profit = item.sellingPrice - unitCost;
    
    // VAT logic
    let vatRate = 0;
    if (item.category === 'General Goods' && state.profile.isSmallCompany === false) {
      vatRate = 0.075; // 7.5%
    }
    const vatCollected = item.sellingPrice * vatRate;

    const sale: SalesLedgerItem = {
      ...item,
      saleDate: new Date().toISOString(),
      profit,
      vatCollected
    };

    const newInventory = [...state.inventory];
    newInventory[itemIdx].quantity -= 1;
    if (newInventory[itemIdx].quantity <= 0) {
      newInventory.splice(itemIdx, 1);
    }

    return {
      inventory: newInventory,
      salesLog: [...state.salesLog, sale]
    };
  })
}));
