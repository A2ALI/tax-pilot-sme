import React, { useState } from 'react';
import { useStore } from '../store';
import { Package, PlusCircle, CheckCircle2 } from 'lucide-react';

export const InventoryForm: React.FC = () => {
  const { addInventoryItem } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Basic Food' | 'Medicine/Books' | 'General Goods'>('General Goods');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  const handleAdd = () => {
    addInventoryItem({
      id: Date.now().toString(),
      name,
      category,
      quantity,
      purchasePrice,
      transportCost,
      laborCost,
      sellingPrice
    });
    setName('');
  };

  // RPA Computed Unit Cost prediction
  const unitCost = quantity > 0 ? (purchasePrice + transportCost + laborCost) / quantity : 0;
  const potentialProfit = sellingPrice > 0 ? sellingPrice - unitCost : 0;

  return (
    <div className="card mb-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Package size={28} />
        <h3 className="card-title">Add Smart Item</h3>
      </div>
      
      <div className="flex-col gap-4">
        <input className="input-field" placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} />
        
        <select className="input-field" value={category} onChange={e => setCategory(e.target.value as any)}>
          <option value="Basic Food">Basic Food (Bread, Rice, Yam)</option>
          <option value="Medicine/Books">Medicine/Books</option>
          <option value="General Goods">General Goods (Clothes, Electronics)</option>
        </select>

        <div className="flex gap-2">
          <input type="number" className="input-field" placeholder="Quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          <input type="number" className="input-field" placeholder="Purchase Price (Total)" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} />
        </div>

        <div className="flex gap-2">
          <input type="number" className="input-field" placeholder="Transport Cost" value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} />
          <input type="number" className="input-field" placeholder="Labor (Loading/Unloading)" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} />
        </div>

        <input type="number" className="input-field border-green" placeholder="Selling Price (Per Unit)" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} />

        {/* RPA Insights */}
        <div style={{ backgroundColor: 'var(--color-light-surface)', padding: '16px', borderRadius: '10px' }}>
          <strong>RPA Analysis:</strong>
          <p>Unit Cost (Purch + Trans + Labor) = ₦{unitCost.toFixed(2)}</p>
          <p>Potential Profit Per Unit = <span style={{ color: potentialProfit > 0 ? 'var(--color-sentiment-positive)' : 'var(--color-sentiment-danger)' }}>₦{potentialProfit.toFixed(2)}</span></p>
          {category !== 'General Goods' && <p style={{ color: 'var(--color-wise-green)', filter: 'brightness(0.6)', fontWeight: 'bold' }}>✓ 0% VAT Auto-Applied (Section 147)</p>}
        </div>

        <button className="btn btn-primary mt-2" onClick={handleAdd}>
          <PlusCircle size={20} className="mr-2" /> Add to Stock
        </button>
      </div>
    </div>
  );
};

export const InventoryList: React.FC = () => {
  const { inventory, markAsSold } = useStore();

  if (inventory.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="sub-heading mb-4" style={{ fontSize: '32px' }}>Current Stock</h3>
      <div className="flex-col gap-4">
        {inventory.map(item => (
          <div key={item.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 className="card-title" style={{ fontSize: '20px' }}>{item.name}</h4>
              <p className="body-light" style={{ fontSize: '14px' }}>Qty: {item.quantity} | Sell: ₦{item.sellingPrice}</p>
              
              {/* Visual Stock Bar */}
              <div style={{ width: '100px', height: '8px', backgroundColor: '#e8ebe6', borderRadius: '4px', marginTop: '8px' }}>
                <div style={{ width: `${Math.min(100, item.quantity * 10)}%`, height: '100%', backgroundColor: 'var(--color-wise-green)', borderRadius: '4px' }}></div>
              </div>
            </div>
            
            <button className="btn btn-secondary" onClick={() => markAsSold(item.id)}>
              <CheckCircle2 color="var(--color-sentiment-positive)" className="mr-2" /> Sold
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
