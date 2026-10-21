import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, Sparkles, RefreshCw } from 'lucide-react';
import { 
  getIngredients, 
  getPackaging, 
  getSettings, 
  saveCalculation 
} from '../services/db';

export default function Chocolate({ onRefresh, editingCalculation }) {
  const [ingredients, setIngredients] = useState([]);
  const [packagingList, setPackagingList] = useState([]);
  const [settings, setSettings] = useState({});
  const [calcId, setCalcId] = useState(null);

  // Form State
  const [name, setName] = useState('Dark Chocolate Ganache Mix');
  const [chocolates, setChocolates] = useState([
    { ingredientId: 'ing_c1', quantity: 250 } // Default to dark chocolate couverture
  ]);
  const [notes, setNotes] = useState('');

  // Selected Packaging: { id, quantity }
  const [selectedPkg, setSelectedPkg] = useState([
    { id: 'pkg_5', quantity: 1 } // Logo sticker by default
  ]);

  // Labour
  const [labourHours, setLabourHours] = useState(1);
  const [overrideLabour, setOverrideLabour] = useState(false);
  const [customLabourCost, setCustomLabourCost] = useState(0);

  // Overheads and Wastage Rate overrides
  const [overheadRate, setOverheadRate] = useState(5);
  const [wastageRate, setWastageRate] = useState(5);

  // Profit Configuration
  const [profitMethod, setProfitMethod] = useState('margin'); // 'margin' | 'fixed' | 'manual'
  const [profitMargin, setProfitMargin] = useState(40); // %
  const [fixedProfit, setFixedProfit] = useState(150); // ₹
  const [manualPrice, setManualPrice] = useState(400); // ₹ total selling price

  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const ings = await getIngredients();
        const list = ings.filter(i => i.category === 'Chocolate');
        const loadedPkg = await getPackaging();
        const loadedSettings = await getSettings();

        setIngredients(list);
        setPackagingList(loadedPkg);
        setSettings(loadedSettings);

        if (!editingCalculation) {
          setOverheadRate(loadedSettings.overheadPercentage || 5);
          setWastageRate(loadedSettings.wastagePercentage || 5);
          setProfitMargin(loadedSettings.profitMargin || 40);
        }
      } catch (e) {
        console.error('Failed to load database records for Chocolate page', e);
      }
    };
    load();
  }, [editingCalculation]);

  useEffect(() => {
    if (editingCalculation && editingCalculation.productType === 'Chocolate') {
      const comp = editingCalculation.components || {};
      setCalcId(editingCalculation.id);
      setName(editingCalculation.productName);
      setNotes(comp.notes || '');
      
      if (comp.chocolates && comp.chocolates.length > 0) {
        setChocolates(comp.chocolates.map(c => ({
          ingredientId: c.ingredientId,
          quantity: c.quantity
        })));
      } else {
        setChocolates([{ ingredientId: '', quantity: '' }]);
      }
      
      setSelectedPkg(comp.packaging && comp.packaging.length > 0 ? comp.packaging.map(p => ({ id: p.id, quantity: p.quantity })) : [{ id: '', quantity: 1 }]);
      
      const totalHours = comp.labourHours || 0;
      const hourlyVal = comp.labourRate || 100;
      if (Math.abs(editingCalculation.labourCost - totalHours * hourlyVal) > 1) {
        setOverrideLabour(true);
        setCustomLabourCost(editingCalculation.labourCost);
      } else {
        setOverrideLabour(false);
        setLabourHours(totalHours);
      }
      
      setOverheadRate(comp.overheadRate || 5);
      setWastageRate(comp.wastageRate || 5);
      
      setManualPrice(editingCalculation.sellingPrice);
      setProfitMargin(editingCalculation.profitMargin || 40);
      setProfitMethod('manual');
    }
  }, [editingCalculation]);

  const handleRefresh = async () => {
    try {
      const ings = await getIngredients();
      setIngredients(ings.filter(i => i.category === 'Chocolate'));
      setPackagingList(await getPackaging());
    } catch (e) {
      console.error('Failed to refresh ingredients and packaging lists', e);
    }
  };

  const handleAddRow = () => {
    setChocolates([...chocolates, { ingredientId: '', quantity: '' }]);
  };

  const handleRemoveRow = (idx) => {
    setChocolates(chocolates.filter((_, i) => i !== idx));
  };

  const handleRowChange = (idx, field, value) => {
    const updated = [...chocolates];
    updated[idx][field] = value;
    setChocolates(updated);
  };

  const handleAddPkg = () => setSelectedPkg([...selectedPkg, { id: '', quantity: 1 }]);
  const handleRemovePkg = (idx) => setSelectedPkg(selectedPkg.filter((_, i) => i !== idx));
  const handlePkgChange = (idx, field, value) => {
    const updated = [...selectedPkg];
    updated[idx][field] = value;
    setSelectedPkg(updated);
  };

  // Cost calculations
  const getChocolateCost = (id, qty) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return 0;
    return ing.costPerUnit * (parseFloat(qty) || 0);
  };

  const getPkgCost = (pkgId, qty) => {
    const pkg = packagingList.find(p => p.id === pkgId);
    if (!pkg) return 0;
    return pkg.costPerPiece * (parseFloat(qty) || 0);
  };

  const materialCost = chocolates.reduce((sum, ch) => sum + getChocolateCost(ch.ingredientId, ch.quantity), 0);
  const totalWeight = chocolates.reduce((sum, ch) => sum + (parseFloat(ch.quantity) || 0), 0);
  const averageCostPerGram = totalWeight > 0 ? materialCost / totalWeight : 0;

  const packagingCost = selectedPkg.reduce((sum, p) => sum + getPkgCost(p.id, p.quantity), 0);

  // Labour
  const hourlyRate = settings.labourRate || 100;
  const calculatedLabourCost = parseFloat(labourHours) * hourlyRate;
  const finalLabourCost = overrideLabour ? parseFloat(customLabourCost) || 0 : calculatedLabourCost;

  // Overheads and Wastage based on raw chocolate cost
  const overheadCost = (overheadRate / 100) * materialCost;
  const wastageCost = (wastageRate / 100) * materialCost;

  // Total Production Cost
  const totalCost = materialCost + packagingCost + finalLabourCost + overheadCost + wastageCost;

  // Selling Price
  let sellingPrice = 0;
  let profit = 0;
  let calculatedMargin = 0;

  if (profitMethod === 'margin') {
    const marginRatio = profitMargin / 100;
    sellingPrice = marginRatio < 1 ? totalCost / (1 - marginRatio) : totalCost;
    profit = sellingPrice - totalCost;
    calculatedMargin = profitMargin;
  } else if (profitMethod === 'fixed') {
    sellingPrice = totalCost + parseFloat(fixedProfit);
    profit = parseFloat(fixedProfit);
    calculatedMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  } else if (profitMethod === 'manual') {
    sellingPrice = parseFloat(manualPrice) || 0;
    profit = sellingPrice - totalCost;
    calculatedMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the calculation.');
      return;
    }

    const validChoc = chocolates.filter(c => c.ingredientId && parseFloat(c.quantity) > 0);
    if (validChoc.length === 0) {
      alert('Please add at least one chocolate ingredient with weight.');
      return;
    }

    const calcData = {
      id: calcId || undefined,
      productName: name.trim(),
      productType: 'Chocolate',
      materialCost,
      packagingCost,
      labourCost: finalLabourCost,
      overheadCost,
      wastageCost,
      totalCost,
      sellingPrice,
      profit,
      profitMargin: calculatedMargin,
      components: {
        chocolates: validChoc.map(c => {
          const ing = ingredients.find(x => x.id === c.ingredientId);
          return {
            ingredientId: c.ingredientId,
            name: ing ? ing.name : 'Unknown',
            quantity: parseFloat(c.quantity),
            cost: getChocolateCost(c.ingredientId, c.quantity)
          };
        }),
        totalWeight,
        packaging: selectedPkg.filter(p => p.id).map(p => {
          const pkg = packagingList.find(x => x.id === p.id);
          return { id: p.id, name: pkg ? pkg.name : 'Unknown', quantity: p.quantity, cost: getPkgCost(p.id, p.quantity) };
        }),
        labourHours,
        labourRate: hourlyRate,
        overheadRate,
        wastageRate,
        notes
      }
    };

    await saveCalculation(calcData);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
    if (onRefresh) await onRefresh();
  };

  return (
    <div className="chocolate-calculator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Chocolate Cost Calculator</h1>
          <p className="page-subtitle">Chocolate-based costing including wrappers, labor times, and selling prices.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} />
            Save Calculation
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="alert alert-success animate-slideUp">
          Calculation <strong>{name}</strong> successfully saved to history snapshot!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }} className="grid-cols-2">
        {/* Left column configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Chocolate formulation weights */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>1. Enter Chocolate Weights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chocolates.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control"
                    value={item.ingredientId}
                    onChange={(e) => handleRowChange(idx, 'ingredientId', e.target.value)}
                  >
                    <option value="">-- Choose Chocolate --</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} {ing.isDemo && '[Demo]'} (₹{ing.costPerUnit.toFixed(4)}/g)
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Weight" 
                      value={item.quantity}
                      onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={chocolates.length === 1 && !item.ingredientId}
                  >
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              onClick={handleAddRow}
            >
              <PlusCircle size={14} /> Add Chocolate Row
            </button>
          </div>

          {/* Section 2: Packaging details */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>2. Packaging</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddPkg}>
                <PlusCircle size={14} /> Add Packaging
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedPkg.map((pkg, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={pkg.id} 
                    onChange={(e) => handlePkgChange(idx, 'id', e.target.value)}
                  >
                    <option value="">-- Choose Packaging Item --</option>
                    {packagingList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDemo && '[Demo]'} (₹{p.costPerPiece}/pc)
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Qty" 
                    value={pkg.quantity} 
                    onChange={(e) => handlePkgChange(idx, 'quantity', e.target.value)}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemovePkg(idx)}>
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Labour hours */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>3. Labour Cost</h3>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <input 
                  type="checkbox" 
                  checked={overrideLabour} 
                  onChange={(e) => setOverrideLabour(e.target.checked)} 
                />
                Override Total Labour Cost Manually
              </label>
            </div>

            {overrideLabour ? (
              <div className="form-group animate-slideUp">
                <label className="form-label">Custom Labour Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Enter total labour cost" 
                  value={customLabourCost} 
                  onChange={(e) => setCustomLabourCost(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Handcrafting & Tempering Time (hours)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="e.g. 1" 
                    value={labourHours} 
                    onChange={(e) => setLabourHours(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate</label>
                  <div style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--text-muted)' }}>
                    ₹{hourlyRate} / hour
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Overheads & Wastage */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>4. Overheads & Wastage Rates</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Overheads (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={overheadRate} 
                  onChange={(e) => setOverheadRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wastage (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={wastageRate} 
                  onChange={(e) => setWastageRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Label Details */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>5. Label & Notes</h3>
            <div className="form-group">
              <label className="form-label">Calculation Label *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. White Chocolate Ganache Mix"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-control"
                placeholder="Ratios, tempering temperature, flavors..."
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right side cost summary receipt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
          {/* Selling Options */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Selling Price Options</h3>
            <div className="form-group">
              <label className="form-label">Pricing Method</label>
              <select 
                className="form-control" 
                value={profitMethod} 
                onChange={(e) => setProfitMethod(e.target.value)}
              >
                <option value="margin">Target Profit Margin (%)</option>
                <option value="fixed">Cost + Fixed Profit (₹)</option>
                <option value="manual">Manual Selling Price (₹)</option>
              </select>
            </div>

            {profitMethod === 'margin' && (
              <div className="form-group animate-slideUp">
                <label className="form-label">Profit Margin (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={profitMargin} 
                  onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {profitMethod === 'fixed' && (
              <div className="form-group animate-slideUp">
                <label className="form-label">Fixed Profit (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={fixedProfit} 
                  onChange={(e) => setFixedProfit(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {profitMethod === 'manual' && (
              <div className="form-group animate-slideUp">
                <label className="form-label">Enter Total Product Selling Price (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={manualPrice} 
                  onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Chocolate Cost Summary Receipt */}
          <div className="receipt">
            <div className="receipt-title">CHOCOLATE COST SUMMARY</div>
            <div className="receipt-subtitle">{name || 'Chocolate Product Costing'}</div>

            {totalWeight > 0 && (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
                Dough/Base Weight: {totalWeight.toFixed(1)} g
              </div>
            )}

            <div className="receipt-row">
              <span>Chocolates Base Cost</span>
              <span>₹{materialCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Packaging Cost</span>
              <span>₹{packagingCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Labour Cost</span>
              <span>₹{finalLabourCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Overhead ({overheadRate}%)</span>
              <span>₹{overheadCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Wastage ({wastageRate}%)</span>
              <span>₹{wastageCost.toFixed(2)}</span>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-row bold">
              <span>TOTAL COST</span>
              <span>₹{totalCost.toFixed(2)}</span>
            </div>

            <div className="receipt-row" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Base cost per gram</span>
              <span>₹{averageCostPerGram.toFixed(4)}/g</span>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-row bold" style={{ color: 'var(--color-success)' }}>
              <span>Suggested Selling Price</span>
              <span>₹{sellingPrice.toFixed(2)}</span>
            </div>

            <div className="receipt-row bold" style={{ color: 'var(--color-accent)' }}>
              <span>Profit</span>
              <span>₹{profit.toFixed(2)}</span>
            </div>

            <div className="receipt-row bold" style={{ color: 'var(--text-secondary)' }}>
              <span>Profit Margin</span>
              <span>{calculatedMargin.toFixed(0)}%</span>
            </div>

            <div className="receipt-footer">
              Pure Cocoa Blends • Eggless Always
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
            <Sparkles size={16} /> Save Chocolate Result
          </button>
        </div>
      </div>
    </div>
  );
}
