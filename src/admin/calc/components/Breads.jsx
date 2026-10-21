import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, Sparkles, RefreshCw } from 'lucide-react';
import { 
  getRecipes, 
  getPackaging, 
  getSettings, 
  saveCalculation 
} from '../services/db';

export default function Breads({ onRefresh, editingCalculation }) {
  const [recipes, setRecipes] = useState([]);
  const [packagingList, setPackagingList] = useState([]);
  const [settings, setSettings] = useState({});
  const [calcId, setCalcId] = useState(null);

  // Form State
  const [name, setName] = useState('Burger Buns');
  const [selectedRecipeId, setSelectedRecipeId] = useState('rec_r3'); // default to sample bread recipe
  const [quantity, setQuantity] = useState(10); // yields 10 pieces
  const [notes, setNotes] = useState('');

  // Selected Packaging: { id, quantity }
  const [selectedPkg, setSelectedPkg] = useState([
    { id: 'pkg_3', quantity: 1 }, // Bread Paper Bag
    { id: 'pkg_5', quantity: 1 }  // Logo Sticker
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
        const loadedRecipes = await getRecipes();
        const loadedPkg = await getPackaging();
        const loadedSettings = await getSettings();

        setRecipes(loadedRecipes);
        setPackagingList(loadedPkg);
        setSettings(loadedSettings);

        if (!editingCalculation) {
          setOverheadRate(loadedSettings.overheadPercentage || 5);
          setWastageRate(loadedSettings.wastagePercentage || 5);
          setProfitMargin(loadedSettings.profitMargin || 40);
        }
      } catch (e) {
        console.error('Failed to load database records for Breads page', e);
      }
    };
    load();
  }, [editingCalculation]);

  useEffect(() => {
    if (editingCalculation && editingCalculation.productType === 'Bread') {
      const comp = editingCalculation.components || {};
      setCalcId(editingCalculation.id);
      setName(editingCalculation.productName);
      setSelectedRecipeId(comp.recipeId || '');
      setQuantity(comp.quantity || 1);
      setNotes(comp.notes || '');
      
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

  const handleRefreshData = async () => {
    try {
      const recs = await getRecipes();
      const pkgs = await getPackaging();
      setRecipes(recs);
      setPackagingList(pkgs);
    } catch (e) {
      console.error('Failed to refresh recipes and packaging lists', e);
    }
  };

  // Find selected recipe
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  // Live Cost Calculations
  const getRecipeCost = () => {
    if (!selectedRecipe) return 0;
    return selectedRecipe.totalCost || 0;
  };

  const getPkgCost = (pkgId, qty) => {
    const pkg = packagingList.find(p => p.id === pkgId);
    if (!pkg) return 0;
    return pkg.costPerPiece * (parseFloat(qty) || 0);
  };

  const recipeCost = getRecipeCost();
  const packagingCost = selectedPkg.reduce((sum, p) => sum + getPkgCost(p.id, p.quantity), 0);

  // Labour cost
  const hourlyRate = settings.labourRate || 100;
  const calculatedLabourCost = parseFloat(labourHours) * hourlyRate;
  const finalLabourCost = overrideLabour ? parseFloat(customLabourCost) || 0 : calculatedLabourCost;

  // Overheads and Wastage based on recipe cost
  const overheadCost = (overheadRate / 100) * recipeCost;
  const wastageCost = (wastageRate / 100) * recipeCost;

  // Total Production Cost
  const totalCost = recipeCost + packagingCost + finalLabourCost + overheadCost + wastageCost;

  // Suggested Selling Price (Total Batch)
  let totalSellingPrice = 0;
  let totalProfit = 0;
  let calculatedMargin = 0;

  if (profitMethod === 'margin') {
    const marginRatio = profitMargin / 100;
    totalSellingPrice = marginRatio < 1 ? totalCost / (1 - marginRatio) : totalCost;
    totalProfit = totalSellingPrice - totalCost;
    calculatedMargin = profitMargin;
  } else if (profitMethod === 'fixed') {
    totalSellingPrice = totalCost + parseFloat(fixedProfit);
    totalProfit = parseFloat(fixedProfit);
    calculatedMargin = totalSellingPrice > 0 ? (totalProfit / totalSellingPrice) * 100 : 0;
  } else if (profitMethod === 'manual') {
    totalSellingPrice = parseFloat(manualPrice) || 0;
    totalProfit = totalSellingPrice - totalCost;
    calculatedMargin = totalSellingPrice > 0 ? (totalProfit / totalSellingPrice) * 100 : 0;
  }

  // Cost and Selling Price per piece
  const yieldCount = parseFloat(quantity) || 1;
  const costPerPiece = totalCost / yieldCount;
  const pricePerPiece = totalSellingPrice / yieldCount;

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a bread calculation name.');
      return;
    }

    const calculationData = {
      id: calcId || undefined,
      productName: name.trim(),
      productType: 'Bread',
      materialCost: recipeCost,
      packagingCost,
      labourCost: finalLabourCost,
      overheadCost,
      wastageCost,
      totalCost,
      sellingPrice: totalSellingPrice,
      profit: totalProfit,
      profitMargin: calculatedMargin,
      components: {
        recipeId: selectedRecipeId,
        quantity: yieldCount,
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

    await saveCalculation(calculationData);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
    if (onRefresh) await onRefresh();
  };

  const handleAddPkg = () => setSelectedPkg([...selectedPkg, { id: '', quantity: 1 }]);
  const handleRemovePkg = (idx) => setSelectedPkg(selectedPkg.filter((_, i) => i !== idx));
  const handlePkgChange = (idx, field, value) => {
    const updated = [...selectedPkg];
    updated[idx][field] = value;
    setSelectedPkg(updated);
  };

  return (
    <div className="breads-calculator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bread Cost Calculator</h1>
          <p className="page-subtitle">Calculate dough costing, batch yield price, and cost per bun or loaf.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleRefreshData}>
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
        {/* Left Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Product Selection */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>1. Bread Info</h3>
            <div className="form-group">
              <label className="form-label">Calculation Label *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Burger Buns Batch"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Bread Recipe *</label>
                <select 
                  className="form-control" 
                  value={selectedRecipeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedRecipeId(id);
                    const rec = recipes.find(r => r.id === id);
                    if (rec) {
                      setQuantity(rec.finishedYield || 1);
                    }
                  }}
                >
                  <option value="">-- Choose Bread Recipe --</option>
                  {recipes.filter(r => r.category === 'Bread').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isDemo && '[Demo]'} (Cost: ₹{r.totalCost.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Produced (Pieces) *</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={quantity} 
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Packaging */}
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

          {/* Section 3: Labour */}
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
                  <label className="form-label">Baking Prep & Handcrafting Time (hours)</label>
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
        </div>

        {/* Right Summary Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
          {/* Profit options */}
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
                <label className="form-label">Enter Total Batch Selling Price (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={manualPrice} 
                  onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Bread Cost Summary */}
          <div className="receipt">
            <div className="receipt-title">BREAD COST SUMMARY</div>
            <div className="receipt-subtitle">{name || 'Bread Costing'}</div>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
              Yield Batch: {yieldCount} Pieces
            </div>

            <div className="receipt-row">
              <span>Recipe Material Cost</span>
              <span>₹{recipeCost.toFixed(2)}</span>
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
              <span>Total Batch Cost</span>
              <span>₹{totalCost.toFixed(2)}</span>
            </div>

            <div className="receipt-row bold" style={{ color: 'var(--color-success)' }}>
              <span>Cost Per Piece</span>
              <span>₹{costPerPiece.toFixed(2)}</span>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-row bold" style={{ color: 'var(--color-accent)' }}>
              <span>Selling Price / Piece</span>
              <span>₹{pricePerPiece.toFixed(2)}</span>
            </div>

            <div className="receipt-row bold" style={{ color: 'var(--color-success)' }}>
              <span>Total Selling Price</span>
              <span>₹{totalSellingPrice.toFixed(2)}</span>
            </div>

            <div className="receipt-row bold">
              <span>Total Profit</span>
              <span>₹{totalProfit.toFixed(2)}</span>
            </div>

            <div className="receipt-row" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>Batch Profit Margin:</span>
              <span>{calculatedMargin.toFixed(0)}%</span>
            </div>

            <div className="receipt-footer">
              Freshly Baked • Eggless Always
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
            <Sparkles size={16} /> Save Bread Result
          </button>
        </div>
      </div>
    </div>
  );
}
