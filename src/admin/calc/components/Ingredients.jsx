import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, History, AlertTriangle } from 'lucide-react';
import { getIngredients, saveIngredient, deleteIngredient, isIngredientUsed, getUnitCost } from '../services/db';

const CATEGORIES = [
  'Chocolate',
  'Baking',
  'Dairy',
  'Fats',
  'Fruits',
  'Nuts',
  'Spreads',
  'Flavours',
  'Decoration',
  'Other'
];

const UNITS = ['g', 'kg', 'ml', 'litre', 'piece', 'pack'];

export default function Ingredients({ onRefresh }) {
  const [ingredients, setIngredients] = useState([]);
  
  useEffect(() => {
    handleRefresh();
  }, []);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [brand, setBrand] = useState('');
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState(UNITS[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  
  // Safeguards
  const [deleteWarning, setDeleteWarning] = useState(null); // { id, name, usedIn: [] }
  const [priceHistoryData, setPriceHistoryData] = useState(null); // ingredient for history modal

  const handleRefresh = async () => {
    const fresh = await getIngredients();
    setIngredients(fresh);
    if (onRefresh) onRefresh();
  };

  const handleOpenAdd = () => {
    setEditingIng(null);
    setName('');
    setCategory(CATEGORIES[0]);
    setCustomCategory('');
    setShowCustomCategoryInput(false);
    setBrand('');
    setPurchaseQuantity('');
    setPurchaseUnit(UNITS[0]);
    setPurchasePrice('');
    setSupplier('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (ing) => {
    setEditingIng(ing);
    setName(ing.name);
    if (CATEGORIES.includes(ing.category)) {
      setCategory(ing.category);
      setShowCustomCategoryInput(false);
    } else {
      setCategory('Custom');
      setCustomCategory(ing.category);
      setShowCustomCategoryInput(true);
    }
    setBrand(ing.brand || '');
    setPurchaseQuantity(ing.purchaseQuantity);
    setPurchaseUnit(ing.purchaseUnit);
    setPurchasePrice(ing.purchasePrice);
    setSupplier(ing.supplier || '');
    setNotes(ing.notes || '');
    setShowModal(true);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val === 'Custom') {
      setShowCustomCategoryInput(true);
    } else {
      setShowCustomCategoryInput(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !purchaseQuantity || !purchasePrice) {
      alert('Please fill out all required fields.');
      return;
    }

    const finalCategory = category === 'Custom' ? (customCategory.trim() || 'Other') : category;
    
    const ingredientData = {
      id: editingIng ? editingIng.id : undefined,
      name: name.trim(),
      category: finalCategory,
      brand: brand.trim(),
      purchaseQuantity: parseFloat(purchaseQuantity),
      purchaseUnit,
      purchasePrice: parseFloat(purchasePrice),
      supplier: supplier.trim(),
      notes: notes.trim()
    };

    await saveIngredient(ingredientData);
    setShowModal(false);
    await handleRefresh();
  };

  const handleDeleteClick = async (ing) => {
    const usedIn = await isIngredientUsed(ing.id);
    if (usedIn.length > 0) {
      setDeleteWarning({
        id: ing.id,
        name: ing.name,
        usedIn
      });
    } else {
      if (confirm(`Are you sure you want to delete ${ing.name}?`)) {
        await deleteIngredient(ing.id);
        await handleRefresh();
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteWarning) {
      await deleteIngredient(deleteWarning.id);
      setDeleteWarning(null);
      await handleRefresh();
    }
  };

  // Unique categories list for filters
  const allCategories = [...new Set(ingredients.map(i => i.category))];

  // Filter & search implementation
  const filteredIngredients = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          (i.brand && i.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = filterCategory ? i.category === filterCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="ingredients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingredients</h1>
          <p className="page-subtitle">Master price list of ingredients. Egg-free by design.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Add Ingredient
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-wrapper">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search ingredient or brand..." 
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
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Ingredient List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th style={{ textAlign: 'right' }}>Purchase Price</th>
                <th>Package Unit</th>
                <th style={{ textAlign: 'right' }}>Cost / Base Unit</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No ingredients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map(ing => {
                  const displayUnit = ing.purchaseUnit === 'kg' ? 'g' : (ing.purchaseUnit === 'litre' ? 'ml' : ing.purchaseUnit);
                  return (
                    <tr key={ing.id}>
                      <td style={{ fontWeight: 600 }}>
                        {ing.name}
                        {ing.isDemo && (
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginLeft: '6px' }}>Demo</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-accent">{ing.category}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{ing.brand || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        ₹{parseFloat(ing.purchasePrice).toFixed(2)}
                      </td>
                      <td>{ing.purchaseQuantity} {ing.purchaseUnit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{ing.costPerUnit.toFixed(displayUnit === 'g' || displayUnit === 'ml' ? 4 : 2)} / {displayUnit}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(ing.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          {ing.priceHistory && ing.priceHistory.length > 0 && (
                            <button 
                              className="btn btn-ghost btn-sm" 
                              title="Price History"
                              onClick={() => setPriceHistoryData(ing)}
                            >
                              <History size={16} color="var(--text-secondary)" />
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm" 
                            title="Edit"
                            onClick={() => handleOpenEdit(ing)}
                          >
                            <Edit2 size={16} color="var(--text-secondary)" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            title="Delete"
                            onClick={() => handleDeleteClick(ing)}
                          >
                            <Trash2 size={16} color="var(--color-danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave}>
            <div className="modal-header">
              <h2>{editingIng ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '1.25rem' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ingredient Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Flour, Cocoa Powder"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-control" 
                    value={showCustomCategoryInput ? 'Custom' : category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">Custom Category...</option>
                  </select>
                </div>

                {showCustomCategoryInput && (
                  <div className="form-group">
                    <label className="form-label">Custom Category Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required={showCustomCategoryInput}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Brand / Make</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Morde, Amul (Optional)"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Quantity *</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0.001"
                    className="form-control" 
                    required 
                    placeholder="e.g. 1, 500"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Unit *</label>
                  <select 
                    className="form-control"
                    value={purchaseUnit}
                    onChange={(e) => setPurchaseUnit(e.target.value)}
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹) *</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0.01"
                    className="form-control" 
                    required 
                    placeholder="e.g. 50, 850"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Live Cost Preview */}
              {purchasePrice && purchaseQuantity && (() => {
                const displayUnit = purchaseUnit === 'kg' ? 'g' : (purchaseUnit === 'litre' ? 'ml' : purchaseUnit);
                const decimals = displayUnit === 'g' || displayUnit === 'ml' ? 4 : 2;
                return (
                  <div className="alert alert-success" style={{ padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    <strong>Live Cost Calculation:</strong> ₹{getUnitCost(purchasePrice, purchaseQuantity, purchaseUnit).toFixed(decimals)} / {displayUnit}
                  </div>
                );
              })()}

              <div className="form-group">
                <label className="form-label">Supplier / Shop</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Local Dairy (Optional)"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  placeholder="Additional details (Optional)"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Ingredient</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Warning Modal (Eggless and safe) */}
      {deleteWarning && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                <AlertTriangle size={24} />
                Cannot Delete Ingredient
              </h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteWarning(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                The ingredient <strong>{deleteWarning.name}</strong> is currently used in the following active recipe(s):
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', listStyleType: 'disc' }}>
                {deleteWarning.usedIn.map((recipe, idx) => (
                  <li key={idx} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{recipe}</li>
                ))}
              </ul>
              <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong>Warning:</strong> Deleting this ingredient will cause recipe costing to fail or skip this ingredient's cost. It is recommended to update the recipes first to remove or swap this ingredient.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteWarning(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Force Delete Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {priceHistoryData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Price History</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPriceHistoryData(null)}>×</button>
            </div>
            <div className="modal-body">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{priceHistoryData.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Current Price: ₹{priceHistoryData.purchasePrice} per {priceHistoryData.purchaseQuantity} {priceHistoryData.purchaseUnit}
              </p>
              
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Previous Price</th>
                      <th>Date Replaced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistoryData.priceHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>₹{parseFloat(h.price).toFixed(2)} / {h.unit}</td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPriceHistoryData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
