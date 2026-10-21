import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calculator, 
  Trash2, 
  Copy, 
  Eye, 
  PlusCircle, 
  Sparkles, 
  RefreshCw,
  Search,
  Edit2
} from 'lucide-react';
import { 
  getSavedCalculations, 
  deleteCalculation, 
  saveCalculation, 
  getRecipes, 
  getPackaging, 
  getSettings 
} from '../services/db';

export default function PriceCalculator({ 
  activeTab = 'calculator', 
  onRefresh, 
  onLoadCalculation,
  editingCalculation
}) {
  const [tab, setTab] = useState(activeTab); // 'calculator' | 'history'
  const [calculations, setCalculations] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [packagingList, setPackagingList] = useState([]);
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [calcId, setCalcId] = useState(null);

  // Quick Calculator Form State
  const [name, setName] = useState('Assorted Brownies Box');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [quantity, setQuantity] = useState(1); // quantity used
  const [notes, setNotes] = useState('');

  // Selected Packaging: { id, quantity }
  const [selectedPkg, setSelectedPkg] = useState([{ id: '', quantity: 1 }]);

  // Labour
  const [labourHours, setLabourHours] = useState(0);
  const [overrideLabour, setOverrideLabour] = useState(false);
  const [customLabourCost, setCustomLabourCost] = useState(0);

  // Overheads and Wastage overrides
  const [overheadRate, setOverheadRate] = useState(5);
  const [wastageRate, setWastageRate] = useState(5);

  // Profit Configuration
  const [profitMethod, setProfitMethod] = useState('margin'); // 'margin' | 'fixed' | 'manual'
  const [profitMargin, setProfitMargin] = useState(40); // %
  const [fixedProfit, setFixedProfit] = useState(200); // ₹
  const [manualPrice, setManualPrice] = useState(500); // ₹ total selling price

  const [savedAlert, setSavedAlert] = useState(false);
  const [viewDetailCalc, setViewDetailCalc] = useState(null); // calculation for detail modal

  useEffect(() => {
    const init = async () => {
      setTab(activeTab);
      await handleRefreshData();
      if (!editingCalculation) {
        setCalcId(null);
      }
    };
    init();
  }, [activeTab, editingCalculation]);

  useEffect(() => {
    if (editingCalculation && editingCalculation.productType === 'Other') {
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
      const calcs = await getSavedCalculations();
      const recs = await getRecipes();
      const pkgs = await getPackaging();
      const loadedSettings = await getSettings();

      setCalculations(calcs);
      setRecipes(recs);
      setPackagingList(pkgs);
      setSettings(loadedSettings);
      
      if (!editingCalculation) {
        setOverheadRate(loadedSettings.overheadPercentage || 5);
        setWastageRate(loadedSettings.wastagePercentage || 5);
        setProfitMargin(loadedSettings.profitMargin || 40);
      }
    } catch (e) {
      console.error('Failed to load database records for Price Calculator page', e);
    }
  };

  // Find selected recipe
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  // costing logic
  const getRecipeCost = () => {
    if (!selectedRecipe) return 0;
    const q = parseFloat(quantity) || 0;
    if (selectedRecipe.costPerGram > 0) {
      return selectedRecipe.costPerGram * q;
    }
    return selectedRecipe.costPerPiece * q;
  };

  const getPkgCost = (pkgId, qty) => {
    const pkg = packagingList.find(p => p.id === pkgId);
    if (!pkg) return 0;
    return pkg.costPerPiece * (parseFloat(qty) || 0);
  };

  const materialCost = getRecipeCost();
  const packagingCost = selectedPkg.reduce((sum, p) => sum + getPkgCost(p.id, p.quantity), 0);

  // Labour
  const hourlyRate = settings.labourRate || 100;
  const calculatedLabourCost = parseFloat(labourHours) * hourlyRate;
  const finalLabourCost = overrideLabour ? parseFloat(customLabourCost) || 0 : calculatedLabourCost;

  // Overheads and Wastage based on material cost
  const overheadCost = (overheadRate / 100) * materialCost;
  const wastageCost = (wastageRate / 100) * materialCost;

  // Total Cost
  const totalCost = materialCost + packagingCost + finalLabourCost + overheadCost + wastageCost;

  // Selling Price & Profit
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a calculation label.');
      return;
    }
    if (!selectedRecipeId) {
      alert('Please select a recipe.');
      return;
    }

    const calcData = {
      id: calcId || undefined,
      productName: name.trim(),
      productType: 'Other',
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
        recipeId: selectedRecipeId,
        quantity: parseFloat(quantity),
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
    await handleRefreshData();
    if (onRefresh) await onRefresh();
  };

  const handleDuplicate = async (calc) => {
    const duplicated = {
      ...calc,
      id: undefined,
      productName: `${calc.productName} (Copy)`,
      createdAt: undefined
    };
    await saveCalculation(duplicated);
    await handleRefreshData();
    if (onRefresh) await onRefresh();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this saved calculation?')) {
      await deleteCalculation(id);
      await handleRefreshData();
      if (onRefresh) await onRefresh();
    }
  };

  const handleAddPkg = () => setSelectedPkg([...selectedPkg, { id: '', quantity: 1 }]);
  const handleRemovePkg = (idx) => setSelectedPkg(selectedPkg.filter((_, i) => i !== idx));
  const handlePkgChange = (idx, field, value) => {
    const updated = [...selectedPkg];
    updated[idx][field] = value;
    setSelectedPkg(updated);
  };

  // Filter calculations search
  const filteredCalculations = calculations.filter(c => 
    c.productName.toLowerCase().includes(search.toLowerCase()) ||
    c.productType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="price-calculator-page animate-slideUp">
      <div className="page-header">
        <div>
          <h1 className="page-title">Price Calculator & History</h1>
          <p className="page-subtitle">Perform quick costing checks or review past bakery estimates.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'calculator' ? 'active' : ''}`} onClick={() => setTab('calculator')}>
          <Calculator size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Quick Product Calculator
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <History size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Saved Calculations ({calculations.length})
        </button>
      </div>

      {tab === 'calculator' && (
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }} className="grid-cols-2">
          {/* Left Column Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Basic Info & Recipe selection */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>1. Basic & Recipe details</h3>
              <div className="form-group">
                <label className="form-label">Calculation Title / Product Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Vanilla Muffins Batch"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Select Recipe *</label>
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
                    required
                  >
                    <option value="">-- Choose Recipe --</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isDemo && '[Demo]'} ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quantity Used {selectedRecipe ? `(${selectedRecipe.yieldType === 'grams' ? 'g' : 'pcs'})` : ''} *
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    min="0.01"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Packaging selection */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>2. Packaging (Optional)</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPkg}>
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
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRemovePkg(idx)}>
                      <Trash2 size={16} color="var(--color-danger)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Labour Cost */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>3. Labour Cost (Optional)</h3>
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
                    <label className="form-label">Labour hours</label>
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

            {/* Overhead & Wastage */}
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

            <div className="card">
              <label className="form-label">Calculation Notes</label>
              <textarea 
                className="form-control"
                placeholder="Details of the quick calculation..."
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Right Column Cost Summary Receipt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
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
                  <label className="form-label">Enter Selling Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={manualPrice} 
                    onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            <div className="receipt">
              <div className="receipt-title">COST SUMMARY</div>
              <div className="receipt-subtitle">{name || 'Bakery cost estimation'}</div>

              {selectedRecipe && (
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
                  Based on Recipe: {selectedRecipe.name}
                </div>
              )}

              <div className="receipt-row">
                <span>Material Cost</span>
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
                Always Egg-free • Handcrafted costings
              </div>
            </div>

            {savedAlert && (
              <div className="alert alert-success animate-slideUp">
                Calculation snapshot saved successfully!
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Sparkles size={16} /> Save Calculation Snapshot
            </button>
          </div>
        </form>
      )}

      {tab === 'history' && (
        <div className="card animate-slideUp" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search history by name or category..." 
              className="form-control"
              style={{ border: 'none', padding: 0 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleRefreshData}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Calculation Date</th>
                  <th style={{ textAlign: 'right' }}>Total Production Cost</th>
                  <th style={{ textAlign: 'right' }}>Selling Price</th>
                  <th style={{ textAlign: 'right' }}>Profit Earnings</th>
                  <th style={{ textAlign: 'center' }}>Margin</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalculations.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No saved calculations matching your filters.
                    </td>
                  </tr>
                ) : (
                  [...filteredCalculations]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(calc => (
                      <tr key={calc.id}>
                        <td style={{ fontWeight: 600 }}>
                          {calc.productName}
                          {calc.isDemo && (
                            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginLeft: '6px' }}>Demo</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            calc.productType === 'Cake' ? 'badge-accent' : 
                            calc.productType === 'Bread' ? 'badge-success' : 'badge-gold'
                          }`}>
                            {calc.productType}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(calc.createdAt).toLocaleDateString()} {new Date(calc.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{calc.totalCost.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-success)' }}>
                          ₹{calc.sellingPrice.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-accent)' }}>
                          ₹{calc.profit.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>
                          {calc.profitMargin.toFixed(0)}%
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              title="View Detailed Receipt"
                              onClick={() => setViewDetailCalc(calc)}
                            >
                              <Eye size={16} color="var(--text-secondary)" />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              title="Edit Calculation"
                              onClick={() => onLoadCalculation(calc)}
                            >
                              <Edit2 size={16} color="var(--text-secondary)" />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              title="Duplicate"
                              onClick={() => handleDuplicate(calc)}
                            >
                              <Copy size={16} color="var(--text-secondary)" />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              title="Delete"
                              onClick={() => handleDelete(calc.id)}
                            >
                              <Trash2 size={16} color="var(--color-danger)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Detail Receipt Modal */}
      {viewDetailCalc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Calculated Sheet Receipt</h2>
              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '1.25rem' }} onClick={() => setViewDetailCalc(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <div className="receipt">
                <div className="receipt-title">COST SUMMARY</div>
                <div className="receipt-subtitle">{viewDetailCalc.productName}</div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Sheet Type: {viewDetailCalc.productType} • Date: {new Date(viewDetailCalc.createdAt).toLocaleDateString()}
                </div>

                <div className="receipt-row">
                  <span>Material Cost</span>
                  <span>₹{viewDetailCalc.materialCost.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Packaging Cost</span>
                  <span>₹{viewDetailCalc.packagingCost.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Labour Cost</span>
                  <span>₹{viewDetailCalc.labourCost.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Overhead Cost</span>
                  <span>₹{viewDetailCalc.overheadCost.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Wastage Cost</span>
                  <span>₹{viewDetailCalc.wastageCost.toFixed(2)}</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row bold">
                  <span>TOTAL COST</span>
                  <span>₹{viewDetailCalc.totalCost.toFixed(2)}</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row bold" style={{ color: 'var(--color-success)' }}>
                  <span>Suggested Selling Price</span>
                  <span>₹{viewDetailCalc.sellingPrice.toFixed(2)}</span>
                </div>

                <div className="receipt-row bold" style={{ color: 'var(--color-accent)' }}>
                  <span>Profit Earnings</span>
                  <span>₹{viewDetailCalc.profit.toFixed(2)}</span>
                </div>

                <div className="receipt-row bold" style={{ color: 'var(--text-secondary)' }}>
                  <span>Profit Margin</span>
                  <span>{viewDetailCalc.profitMargin.toFixed(0)}%</span>
                </div>

                {viewDetailCalc.components && viewDetailCalc.components.notes && (
                  <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Notes: {viewDetailCalc.components.notes}
                  </div>
                )}

                <div className="receipt-footer">
                  D's Divine Crust Costing System
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewDetailCalc(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
