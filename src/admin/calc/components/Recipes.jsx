import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { 
  getRecipes, 
  saveRecipe, 
  deleteRecipe, 
  getIngredients, 
  isRecipeUsedInCalculations,
  getBaseUnit 
} from '../services/db';

const RECIPE_CATEGORIES = [
  'Cake Sponge',
  'Filling',
  'Topping',
  'Decoration',
  'Bread',
  'Other'
];

export default function Recipes({ onRefresh }) {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  
  useEffect(() => {
    handleRefresh();
  }, []);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Recipe Builder State
  const [isBuilding, setIsBuilding] = useState(false);
  const [builderId, setBuilderId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(RECIPE_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [finishedYield, setFinishedYield] = useState(1);
  const [yieldType, setYieldType] = useState('grams'); // 'grams' or 'pieces'
  
  // List of added ingredient items in the recipe
  // Structure: { ingredientId, quantity, unit }
  const [recipeItems, setRecipeItems] = useState([]);
  
  // Deletion warnings
  const [deleteWarning, setDeleteWarning] = useState(null); // { id, name, usedIn: [] }

  const handleRefresh = async () => {
    const freshRecipes = await getRecipes();
    const freshIngs = await getIngredients();
    setRecipes(freshRecipes);
    setIngredients(freshIngs);
    if (onRefresh) onRefresh();
  };

  const handleOpenAdd = () => {
    setBuilderId(null);
    setName('');
    setCategory(RECIPE_CATEGORIES[0]);
    setNotes('');
    setFinishedYield(1);
    setYieldType('grams');
    setRecipeItems([{ ingredientId: '', quantity: '', unit: 'g' }]);
    setIsBuilding(true);
  };

  const handleOpenEdit = (rec) => {
    setBuilderId(rec.id);
    setName(rec.name);
    setCategory(rec.category);
    setNotes(rec.notes || '');
    setFinishedYield(rec.finishedYield || 1);
    setYieldType(rec.yieldType || 'grams');
    
    // Map items
    const items = rec.items.map(item => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit
    }));
    setRecipeItems(items.length > 0 ? items : [{ ingredientId: '', quantity: '', unit: 'g' }]);
    setIsBuilding(true);
  };

  const handleDuplicate = async (rec) => {
    const duplicated = {
      ...rec,
      id: undefined,
      name: `${rec.name} (Copy)`,
      isDemo: false, // Copy is user data
      createdAt: undefined,
      updatedAt: undefined
    };
    await saveRecipe(duplicated);
    await handleRefresh();
  };

  const handleAddIngredientRow = () => {
    setRecipeItems([...recipeItems, { ingredientId: '', quantity: '', unit: 'g' }]);
  };

  const handleRemoveIngredientRow = (idx) => {
    const updated = recipeItems.filter((_, i) => i !== idx);
    setRecipeItems(updated.length > 0 ? updated : [{ ingredientId: '', quantity: '', unit: 'g' }]);
  };

  const handleRowChange = (idx, field, value) => {
    const updated = [...recipeItems];
    updated[idx][field] = value;
    
    // Auto-update unit based on ingredient selected
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === value);
      if (ing) {
        updated[idx].unit = getBaseUnit(ing.purchaseUnit);
      }
    }
    
    setRecipeItems(updated);
  };

  const handleDeleteClick = async (rec) => {
    const usedIn = await isRecipeUsedInCalculations(rec.id);
    if (usedIn.length > 0) {
      setDeleteWarning({
        id: rec.id,
        name: rec.name,
        usedIn
      });
    } else {
      if (confirm(`Are you sure you want to delete the recipe ${rec.name}?`)) {
        await deleteRecipe(rec.id);
        await handleRefresh();
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteWarning) {
      await deleteRecipe(deleteWarning.id);
      setDeleteWarning(null);
      await handleRefresh();
    }
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Recipe name is required.');
      return;
    }

    const validItems = recipeItems.filter(item => item.ingredientId && parseFloat(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid ingredient with quantity.');
      return;
    }

    const recipeData = {
      id: builderId || undefined,
      name: name.trim(),
      category,
      items: validItems.map(i => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity),
        unit: i.unit
      })),
      yieldType,
      finishedYield: parseFloat(finishedYield) || 1,
      notes: notes.trim()
    };

    await saveRecipe(recipeData);
    setIsBuilding(false);
    await handleRefresh();
  };

  // Live total calculations inside builder
  const calculateLiveTotals = () => {
    let totalCost = 0;
    let totalWeight = 0;
    
    recipeItems.forEach(item => {
      if (item.ingredientId && parseFloat(item.quantity) > 0) {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (ing) {
          const cost = ing.costPerUnit * parseFloat(item.quantity);
          totalCost += cost;
          if (item.unit === 'g' || item.unit === 'ml') {
            totalWeight += parseFloat(item.quantity);
          }
        }
      }
    });

    const yieldVal = parseFloat(finishedYield) || 1;
    const costPerGram = yieldType === 'grams' ? totalCost / yieldVal : 0;
    const costPerPiece = yieldType === 'pieces' ? totalCost / yieldVal : 0;

    return {
      totalCost,
      totalWeight,
      costPerGram,
      costPerPiece
    };
  };

  const liveTotals = calculateLiveTotals();

  // Filters & Search
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory ? r.category === filterCategory : true;
    return matchesSearch && matchesCat;
  });

  if (isBuilding) {
    return (
      <div className="recipes-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">{builderId ? 'Edit Recipe' : 'Create New Recipe'}</h1>
            <p className="page-subtitle">Assemble items into a recipe sponge, filling, topping, or bread dough.</p>
          </div>
        </div>

        <form onSubmit={handleSaveRecipe} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }} className="grid-cols-2">
          {/* Left: Recipe Formulation */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Recipe Ingredients</h3>
            
            <div className="recipe-items-list">
              {recipeItems.map((item, idx) => (
                <div key={idx} className="recipe-item-row">
                  {/* Select Ingredient */}
                  <div>
                    <select 
                      className="form-control"
                      value={item.ingredientId}
                      onChange={(e) => handleRowChange(idx, 'ingredientId', e.target.value)}
                      required
                    >
                      <option value="">-- Choose Ingredient --</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} {ing.isDemo && '[Demo]'} ({ing.brand || 'No brand'}) - ₹{ing.costPerUnit.toFixed(ing.purchaseUnit === 'kg' || ing.purchaseUnit === 'g' || ing.purchaseUnit === 'litre' || ing.purchaseUnit === 'ml' ? 4 : 2)}/{ing.purchaseUnit === 'kg' ? 'g' : ing.purchaseUnit === 'litre' ? 'ml' : ing.purchaseUnit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <input 
                      type="number" 
                      step="any"
                      min="0.001"
                      className="form-control"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  {/* Unit Label */}
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {item.unit || 'g'}
                  </div>

                  {/* Delete Button */}
                  <div>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      disabled={recipeItems.length === 1 && !item.ingredientId}
                    >
                      <Trash2 size={18} color="var(--color-danger)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={handleAddIngredientRow}
            >
              <PlusCircle size={16} />
              Add Ingredient Line
            </button>
          </div>

          {/* Right: Recipe Configuration & Live Cost Panel */}
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Recipe Settings</h3>
              
              <div className="form-group">
                <label className="form-label">Recipe Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Vanilla Sponge, Chocolate Ganache"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {RECIPE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Yield Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="yieldType" 
                      value="grams"
                      checked={yieldType === 'grams'}
                      onChange={() => setYieldType('grams')}
                    />
                    Weight-based (Grams)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="yieldType" 
                      value="pieces"
                      checked={yieldType === 'pieces'}
                      onChange={() => setYieldType('pieces')}
                    />
                    Quantity-based (Pieces)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Finished Yield *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    min="0.001" 
                    step="any"
                    className="form-control"
                    placeholder={yieldType === 'grams' ? 'e.g. 650' : 'e.g. 10'}
                    value={finishedYield}
                    onChange={(e) => setFinishedYield(e.target.value)}
                    required
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {yieldType === 'grams' ? 'grams' : 'pieces'}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  The expected final output after baking/processing. Used as costing divisor.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Baking / Formulation Notes</label>
                <textarea 
                  className="form-control"
                  placeholder="Baking temperature, timing, instructions..."
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Cost Receipt Card */}
            <div className="receipt">
              <div className="receipt-title">RECIPE FORMULA</div>
              <div className="receipt-subtitle">{category}</div>
              
              <div className="receipt-row">
                <span>Ingredients Subtotal</span>
                <span>₹{liveTotals.totalCost.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Raw Ingredients Weight</span>
                <span>{liveTotals.totalWeight.toFixed(1)} g</span>
              </div>
              
              <div className="receipt-row bold" style={{ color: 'var(--color-success)' }}>
                <span>Expected Finished Yield</span>
                <span>{finishedYield} {yieldType === 'grams' ? 'g' : 'pcs'}</span>
              </div>

              <div className="receipt-divider"></div>

              {yieldType === 'grams' ? (
                <div className="receipt-row total">
                  <span>Cost per finished gram</span>
                  <span>₹{liveTotals.costPerGram.toFixed(4)}/g</span>
                </div>
              ) : (
                <div className="receipt-row total">
                  <span>Cost per finished piece</span>
                  <span>₹{liveTotals.costPerPiece.toFixed(2)}/pc</span>
                </div>
              )}

              {yieldType === 'grams' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  ₹{(liveTotals.costPerGram * 100).toFixed(2)} / 100g
                </div>
              )}

              <div className="receipt-footer">
                Egg-free bakery calculator
              </div>
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setIsBuilding(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                Save Recipe
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">Formulate sponges, fillings, toppings, decorations, and breads.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Create Recipe
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-wrapper">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search recipes..." 
            className="form-control" 
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="form-control" 
          style={{ width: '200px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {RECIPE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Recipes Cards */}
      <div className="grid-cols-3">
        {filteredRecipes.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No recipes created yet. Click "Create Recipe" to start.
          </div>
        ) : (
          filteredRecipes.map(rec => (
            <div key={rec.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-accent">{rec.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {rec.items.length} ingredients
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {rec.name}
                  {rec.isDemo && (
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>Demo</span>
                  )}
                </h3>
                {rec.notes && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden', 
                    marginBottom: '0.75rem' 
                  }}>
                    {rec.notes}
                  </p>
                )}
              </div>

              <div>
                <div style={{ 
                  backgroundColor: 'var(--bg-primary)', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Finished Cost:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {rec.costPerGram > 0 ? `₹${rec.costPerGram.toFixed(4)} / g` : `₹${rec.costPerPiece.toFixed(2)} / pc`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    title="Duplicate Recipe"
                    onClick={() => handleDuplicate(rec)}
                  >
                    <Copy size={16} color="var(--text-secondary)" />
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    title="Edit"
                    onClick={() => handleOpenEdit(rec)}
                  >
                    <Edit2 size={16} color="var(--text-secondary)" />
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    title="Delete"
                    onClick={() => handleDeleteClick(rec)}
                  >
                    <Trash2 size={16} color="var(--color-danger)" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                <AlertTriangle size={24} />
                Cannot Delete Recipe
              </h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteWarning(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                The recipe <strong>{deleteWarning.name}</strong> is currently referenced inside these saved calculations:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', listStyleType: 'disc' }}>
                {deleteWarning.usedIn.map((calcName, idx) => (
                  <li key={idx} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{calcName}</li>
                ))}
              </ul>
              <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong>Warning:</strong> Forcing deletion will break the historical cost audit breakdown for these calculations. Consider duplicating or keeping this recipe, or remove references first.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteWarning(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Force Delete Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
