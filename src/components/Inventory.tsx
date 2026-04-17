import React, { useState } from 'react';
import { useStore } from '../store';
import { Layers, PlusCircle, CheckCircle2 } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { inventory, addInventoryItem, markAsSold } = useStore();
  const [activeTab, setActiveTab] = useState<'Bulk' | 'Single'>('Bulk');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Basic Food' | 'Medicine/Books' | 'General Goods'>('General Goods');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number | ''>('');
  const [transportCost, setTransportCost] = useState<number | ''>('');
  const [laborCost, setLaborCost] = useState<number | ''>('');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number | ''>('');

  const numQty = Number(quantity) || 0;
  const numPrice = Number(purchasePricePerUnit) || 0;
  const numTransport = Number(transportCost) || 0;
  const numLabor = Number(laborCost) || 0;
  const numSelling = Number(sellingPricePerUnit) || 0;

  const totalPurchase = numQty * numPrice;
  const trueUnitCost = numQty > 0 
    ? (totalPurchase + numTransport + numLabor) / numQty 
    : 0;

  const handleAdd = () => {
    if (!name || numQty <= 0) return;
    
    addInventoryItem({
      id: Date.now().toString(),
      name,
      category,
      quantity: numQty,
      entryType: activeTab,
      purchasePricePerUnit: numPrice,
      totalTransportCost: numTransport,
      totalLaborCost: numLabor,
      trueUnitCost,
      sellingPricePerUnit: numSelling
    });
    
    setName('');
    setQuantity(activeTab === 'Bulk' ? 10 : 1);
    setPurchasePricePerUnit('');
    setTransportCost('');
    setLaborCost('');
    setSellingPricePerUnit('');
  };

  return (
    <div>
      <div className="card mb-4" style={{ marginTop: '24px' }}>
        <h3 className="card-title mb-4">Add Item to Ledger</h3>
        
        <div className="flex gap-2 mb-4" style={{ backgroundColor: 'var(--color-light-surface)', padding: '4px', borderRadius: '12px' }}>
          <button 
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'Bulk' ? 'var(--color-white)' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => { setActiveTab('Bulk'); setQuantity(10); setTransportCost(''); setLaborCost(''); }}
          >
            Bulk Entry (Trader)
          </button>
          <button 
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'Single' ? 'var(--color-white)' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => { setActiveTab('Single'); setQuantity(1); setTransportCost(0); setLaborCost(0); }}
          >
            Single Entry
          </button>
        </div>

        <div className="flex-col gap-4">
          <div>
            <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Item Name</label>
            <input className="input-field" placeholder="e.g. Bag of Rice" value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div>
            <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Tax Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value as any)}>
              <option value="Basic Food">Basic Food (Bread, Rice, Yam)</option>
              <option value="Medicine/Books">Medicine/Books</option>
              <option value="General Goods">General Goods (Clothes, Electronics)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Quantity</label>
              <input type="number" className="input-field" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} readOnly={activeTab === 'Single'} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Purchase Cost (Per Unit) ₦</label>
              <input type="number" className="input-field" placeholder="0" value={purchasePricePerUnit} onChange={e => setPurchasePricePerUnit(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          {activeTab === 'Bulk' && (
            <div className="flex gap-2">
              <div style={{ flex: 1 }}>
                <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Total Transport/Logistics ₦</label>
                <input type="number" className="input-field" placeholder="0" value={transportCost} onChange={e => setTransportCost(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Total Labour/Loading ₦</label>
                <input type="number" className="input-field" placeholder="0" value={laborCost} onChange={e => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          )}

          <div>
            <label className="body-light" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-sentiment-positive)' }}>Final Selling Price (Per Unit) ₦</label>
            <input type="number" className="input-field" style={{ borderColor: 'var(--color-wise-green)' }} placeholder="0" value={sellingPricePerUnit} onChange={e => setSellingPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          {activeTab === 'Bulk' && (
             <div style={{ backgroundColor: 'var(--color-subtle-green)', padding: '16px', borderRadius: '10px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={20} color="var(--color-wise-green)" />
                  <strong>RPA Logistics Math</strong>
                </div>
                <p className="body-light" style={{ fontSize: '14px' }}>Base Inventory Cost: ₦{totalPurchase.toFixed(2)}</p>
                <p className="body-light" style={{ fontSize: '14px' }}>+ Logistics Added: ₦{(numTransport + numLabor).toFixed(2)}</p>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: '8px', paddingTop: '8px' }}>
                  <strong>True Unit Cost: ₦{trueUnitCost.toFixed(2)}</strong>
                </div>
             </div>
          )}

          <button className="btn btn-primary mt-2" onClick={handleAdd}>
             <PlusCircle size={20} className="mr-2" /> 
             {activeTab === 'Bulk' ? `Generate Ledger (${numQty} Units)` : 'Add Single Item'}
          </button>
        </div>
      </div>

      <h3 className="sub-heading mb-4 mt-8" style={{ fontSize: '32px' }}>Inventory List</h3>
      <div className="flex-col gap-4 pb-8">
        {inventory.length === 0 && <p className="body-light">No items in stock.</p>}
        {inventory.map(item => (
          <div key={item.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid var(--color-wise-green)' }}>
            <div>
              <h4 className="card-title" style={{ fontSize: '20px' }}>{item.name}</h4>
              <p className="body-light" style={{ fontSize: '14px', color: 'var(--color-gray)' }}>
                Units Left: <strong>{item.quantity}</strong> | True Cost: ₦{item.trueUnitCost.toFixed(2)}
              </p>
            </div>
            <button className="btn" style={{ padding: '8px 16px', backgroundColor: 'var(--color-light-surface)', borderRadius: '999px', fontSize: '14px' }} onClick={() => markAsSold(item.id)}>
              <CheckCircle2 color="var(--color-sentiment-positive)" size={16} className="mr-2" /> Mark Sold
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
