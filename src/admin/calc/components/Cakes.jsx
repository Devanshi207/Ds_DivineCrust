import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, Sparkles, RefreshCw } from 'lucide-react';
import { 
  getRecipes, 
  getPackaging, 
  getSettings, 
  saveCalculation 
} from '../services/db';

export default function Cakes({ onRefresh, editingCalculation }) {
  const [recipes, setRecipes] = useState([]);
  const [packagingList, setPackagingList] = useState([]);
  const [settings, setSettings] = useState({});
  const [calcId, setCalcId] = useState(null);

  // Form State
  const [name, setName] = useState('Chocolate Truffle Cake');
  const [weight, setWeight] = useState('1kg');
  const [layers, setLayers] = useState('3');
  const [notes, setNotes] = useState('');

  // Sponges, Fillings, Toppings
  const [sponges, setSponges] = useState([{ recipeId: 'rec_r1', quantity: 450 }]);
  const [fillings, setFillings] = useState([{ recipeId: 'rec_r2', quantity: 300 }]);
  const [toppings, setToppings] = useState([{ recipeId: 'rec_r2', quantity: 150 }]);

  // Decorations: { recipeId, name, isCustom, quantity, cost }
  const [decorations, setDecorations] = useState([
    { recipeId: 'rec_r2', name: '', isCustom: false, quantity: 50, cost: 0 },
    { recipeId: '', name: 'Chocolate Shards / Flakes', isCustom: true, quantity: 1, cost: 60 }
  ]);

  // Packaging: { id, quantity }
  const [selectedPkg, setSelectedPkg] = useState([
    { id: 'pkg_1', quantity: 1 },
    { id: 'pkg_2', quantity: 1 }
  ]);

  // Labour
  const [prepHours, setPrepHours] = useState(2);
  const [decoHours, setDecoHours] = useState(1);
  const [overrideLabour, setOverrideLabour] = useState(false);
  const [customLabourCost, setCustomLabourCost] = useState(0);

  // Overheads and Wastage Rate overrides
  const [overheadRate, setOverheadRate] = useState(5);
  const [wastageRate, setWastageRate] = useState(5);

  // Profit Configuration
  const [profitMethod, setProfitMethod] = useState('margin'); // 'margin' | 'fixed' | 'manual'
  const [profitMargin, setProfitMargin] = useState(40); // %
  const [fixedProfit, setFixedProfit] = useState(500); // ₹
  const [manualPrice, setManualPrice] = useState(1800); // ₹

  // Success alert
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
        
        // Pull defaults from settings if not editing
        if (!editingCalculation) {
          setOverheadRate(loadedSettings.overheadPercentage || 5);
          setWastageRate(loadedSettings.wastagePercentage || 5);
          setProfitMargin(loadedSettings.profitMargin || 40);
        }
      } catch (e) {
        console.error('Failed to load database records for Cakes page', e);
      }
    };
    load();
  }, [editingCalculation]);

  useEffect(() => {
    if (editingCalculation && editingCalculation.productType === 'Cake') {
      const comp = editingCalculation.components || {};
      setCalcId(editingCalculation.id);
      setName(editingCalculation.productName);
      setWeight(comp.weight || '1kg');
      setLayers(comp.layers || '3');
      setNotes(comp.notes || '');
      
      setSponges(comp.sponges && comp.sponges.length > 0 ? comp.sponges : [{ recipeId: '', quantity: '' }]);
      setFillings(comp.fillings && comp.fillings.length > 0 ? comp.fillings : [{ recipeId: '', quantity: '' }]);
      setToppings(comp.toppings && comp.toppings.length > 0 ? comp.toppings : [{ recipeId: '', quantity: '' }]);
      
      const decoMapped = comp.decorations ? comp.decorations.map(d => {
        if (d.isCustom || typeof d.recipeId === 'undefined') {
          return { recipeId: '', name: d.name || 'Custom Decoration', isCustom: true, quantity: 1, cost: d.cost || 0 };
        }
        return { recipeId: d.recipeId, name: '', isCustom: false, quantity: d.quantity || 1, cost: 0 };
      }) : [{ recipeId: '', name: '', isCustom: false, quantity: '', cost: '' }];
      
      setDecorations(decoMapped);
      setSelectedPkg(comp.packaging && comp.packaging.length > 0 ? comp.packaging.map(p => ({ id: p.id, quantity: p.quantity })) : [{ id: '', quantity: 1 }]);
      
      const totalHours = comp.labourHours || 0;
      const hourlyVal = comp.labourRate || 100;
      if (Math.abs(editingCalculation.labourCost - totalHours * hourlyVal) > 1) {
        setOverrideLabour(true);
        setCustomLabourCost(editingCalculation.labourCost);
      } else {
        setOverrideLabour(false);
        setPrepHours(totalHours * 0.67);
        setDecoHours(totalHours * 0.33);
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

  const filterRecipes = (category) => recipes.filter(r => r.category === category);
  
  const getRecipeCost = (recipeId, qty) => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return 0;
    const q = parseFloat(qty) || 0;
    if (rec.costPerGram > 0) {
      return rec.costPerGram * q;
    }
    return rec.costPerPiece * q;
  };

  const getPkgCost = (pkgId, qty) => {
    const pkg = packagingList.find(p => p.id === pkgId);
    if (!pkg) return 0;
    return pkg.costPerPiece * (parseFloat(qty) || 0);
  };

  // Component costs
  const totalSpongeCost = sponges.reduce((sum, s) => sum + getRecipeCost(s.recipeId, s.quantity), 0);
  const totalFillingCost = fillings.reduce((sum, f) => sum + getRecipeCost(f.recipeId, f.quantity), 0);
  const totalToppingCost = toppings.reduce((sum, t) => sum + getRecipeCost(t.recipeId, t.quantity), 0);
  
  const totalDecoCost = decorations.reduce((sum, d) => {
    if (d.isCustom) {
      return sum + (parseFloat(d.cost) || 0);
    }
    return sum + getRecipeCost(d.recipeId, d.quantity);
  }, 0);

  const materialCost = totalSpongeCost + totalFillingCost + totalToppingCost + totalDecoCost;

  const packagingCost = selectedPkg.reduce((sum, p) => sum + getPkgCost(p.id, p.quantity), 0);

  // Labour
  const hourlyRate = settings.labourRate || 100;
  const calculatedLabourCost = (parseFloat(prepHours) + parseFloat(decoHours)) * hourlyRate;
  const finalLabourCost = overrideLabour ? parseFloat(customLabourCost) || 0 : calculatedLabourCost;

  // Overheads and Wastage
  const overheadCost = (overheadRate / 100) * materialCost;
  const wastageCost = (wastageRate / 100) * materialCost;

  // Total Production Cost
  const totalCost = materialCost + packagingCost + finalLabourCost + overheadCost + wastageCost;

  // Suggested Selling Price & Profit
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
      alert('Please enter a name for the cake.');
      return;
    }

    const calculationData = {
      id: calcId || undefined,
      productName: name.trim(),
      productType: 'Cake',
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
        weight,
        layers,
        sponges: sponges.filter(s => s.recipeId),
        fillings: fillings.filter(f => f.recipeId),
        toppings: toppings.filter(t => t.recipeId),
        decorations: decorations.filter(d => d.isCustom ? d.name : d.recipeId),
        packaging: selectedPkg.filter(p => p.id).map(p => {
          const pkg = packagingList.find(x => x.id === p.id);
          return { id: p.id, name: pkg ? pkg.name : 'Unknown', quantity: p.quantity, cost: getPkgCost(p.id, p.quantity) };
        }),
        labourHours: parseFloat(prepHours) + parseFloat(decoHours),
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

  const handleAddSponge = () => setSponges([...sponges, { recipeId: '', quantity: '' }]);
  const handleRemoveSponge = (idx) => setSponges(sponges.filter((_, i) => i !== idx));
  const handleSpongeChange = (idx, field, value) => {
    const updated = [...sponges];
    updated[idx][field] = value;
    setSponges(updated);
  };

  const handleAddFilling = () => setFillings([...fillings, { recipeId: '', quantity: '' }]);
  const handleRemoveFilling = (idx) => setFillings(fillings.filter((_, i) => i !== idx));
  const handleFillingChange = (idx, field, value) => {
    const updated = [...fillings];
    updated[idx][field] = value;
    setFillings(updated);
  };

  const handleAddTopping = () => setToppings([...toppings, { recipeId: '', quantity: '' }]);
  const handleRemoveTopping = (idx) => setToppings(toppings.filter((_, i) => i !== idx));
  const handleToppingChange = (idx, field, value) => {
    const updated = [...toppings];
    updated[idx][field] = value;
    setToppings(updated);
  };

  const handleAddDeco = () => setDecorations([...decorations, { recipeId: '', name: '', isCustom: false, quantity: '', cost: '' }]);
  const handleRemoveDeco = (idx) => setDecorations(decorations.filter((_, i) => i !== idx));
  const handleDecoChange = (idx, field, value) => {
    const updated = [...decorations];
    updated[idx][field] = value;
    if (field === 'isCustom') {
      updated[idx].recipeId = '';
      updated[idx].name = '';
      updated[idx].cost = '';
    }
    setDecorations(updated);
  };

  const handleAddPkg = () => setSelectedPkg([...selectedPkg, { id: '', quantity: 1 }]);
  const handleRemovePkg = (idx) => setSelectedPkg(selectedPkg.filter((_, i) => i !== idx));
  const handlePkgChange = (idx, field, value) => {
    const updated = [...selectedPkg];
    updated[idx][field] = value;
    setSelectedPkg(updated);
  };

  return (
    <div className="cakes-calculator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cake Cost Calculator</h1>
          <p className="page-subtitle">Formulate material costs, labor, packaging, and markups in real-time.</p>
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
          {/* Section 1: Basic Info */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>1. Cake Info</h3>
            <div className="form-group">
              <label className="form-label">Cake Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Chocolate Truffle Cake"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Weight</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  placeholder="e.g. 1kg, 500g"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Layers (Optional)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={layers} 
                  onChange={(e) => setLayers(e.target.value)} 
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sponges */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>2. Cake Sponges</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddSponge}>
                <PlusCircle size={14} /> Add Sponge
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sponges.map((sponge, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={sponge.recipeId} 
                    onChange={(e) => handleSpongeChange(idx, 'recipeId', e.target.value)}
                  >
                    <option value="">-- Choose Sponge Recipe --</option>
                    {filterRecipes('Cake Sponge').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isDemo && '[Demo]'} (₹{r.costPerGram.toFixed(4)}/g)
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Weight" 
                      value={sponge.quantity} 
                      onChange={(e) => handleSpongeChange(idx, 'quantity', e.target.value)}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveSponge(idx)}>
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Fillings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>3. Cake Fillings</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddFilling}>
                <PlusCircle size={14} /> Add Filling
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fillings.map((filling, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={filling.recipeId} 
                    onChange={(e) => handleFillingChange(idx, 'recipeId', e.target.value)}
                  >
                    <option value="">-- Choose Filling Recipe --</option>
                    {filterRecipes('Filling').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isDemo && '[Demo]'} (₹{r.costPerGram.toFixed(4)}/g)
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Weight" 
                      value={filling.quantity} 
                      onChange={(e) => handleFillingChange(idx, 'quantity', e.target.value)}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveFilling(idx)}>
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Toppings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>4. Cake Toppings</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddTopping}>
                <PlusCircle size={14} /> Add Topping
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {toppings.map((topping, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={topping.recipeId} 
                    onChange={(e) => handleToppingChange(idx, 'recipeId', e.target.value)}
                  >
                    <option value="">-- Choose Topping Recipe --</option>
                    {filterRecipes('Topping').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isDemo && '[Demo]'} (₹{r.costPerGram.toFixed(4)}/g)
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Weight" 
                      value={topping.quantity} 
                      onChange={(e) => handleToppingChange(idx, 'quantity', e.target.value)}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveTopping(idx)}>
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Decorations */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>5. Cake Decorations</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddDeco}>
                <PlusCircle size={14} /> Add Deco
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {decorations.map((deco, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={deco.isCustom} 
                        onChange={(e) => handleDecoChange(idx, 'isCustom', e.target.checked)} 
                      />
                      Fixed Cost / Custom Item
                    </label>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    {deco.isCustom ? (
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Topper Name (e.g. Acrylic Tag)" 
                        value={deco.name}
                        onChange={(e) => handleDecoChange(idx, 'name', e.target.value)}
                      />
                    ) : (
                      <select 
                        className="form-control" 
                        value={deco.recipeId} 
                        onChange={(e) => handleDecoChange(idx, 'recipeId', e.target.value)}
                      >
                        <option value="">-- Choose Decoration Recipe --</option>
                        {filterRecipes('Decoration').map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.isDemo && '[Demo]'} (₹{r.costPerGram.toFixed(4)}/g)
                          </option>
                        ))}
                      </select>
                    )}

                    {deco.isCustom ? (
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>₹</span>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Price" 
                          value={deco.cost}
                          onChange={(e) => handleDecoChange(idx, 'cost', e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Weight" 
                          value={deco.quantity}
                          onChange={(e) => handleDecoChange(idx, 'quantity', e.target.value)}
                        />
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                      </>
                    )}

                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveDeco(idx)}>
                      <Trash2 size={16} color="var(--color-danger)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Packaging */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>6. Packaging</h3>
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

          {/* Section 7: Labour */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>7. Labour Cost</h3>
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
                <div className="form-group">
                  <label className="form-label">Prep Time (hours)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="e.g. 2" 
                    value={prepHours} 
                    onChange={(e) => setPrepHours(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Decoration Time (hours)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="e.g. 1" 
                    value={decoHours} 
                    onChange={(e) => setDecoHours(e.target.value)}
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

          {/* Section 8: Overheads & Wastage */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>8. Overheads & Wastage Rates</h3>
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

        {/* Right Cost Summary & Receipt Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
          {/* Pricing Calculator */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Suggested Selling Price</h3>
            
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

          {/* Cost Summary Box */}
          <div className="receipt">
            <div className="receipt-title">CAKE COST SUMMARY</div>
            <div className="receipt-subtitle">{name || 'Custom Cake Costing'}</div>

            {weight && (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
                Size: {weight} {layers ? `(${layers} Layers)` : ''}
              </div>
            )}

            <div className="receipt-row">
              <span>Sponge</span>
              <span>₹{totalSpongeCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Filling</span>
              <span>₹{totalFillingCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Topping</span>
              <span>₹{totalToppingCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Decoration</span>
              <span>₹{totalDecoCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Packaging</span>
              <span>₹{packagingCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Labour</span>
              <span>₹{finalLabourCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Overhead</span>
              <span>₹{overheadCost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Wastage</span>
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
              Vegetarian • Always Egg-free
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
            <Sparkles size={16} /> Save Cake Result
          </button>
        </div>
      </div>
    </div>
  );
}
