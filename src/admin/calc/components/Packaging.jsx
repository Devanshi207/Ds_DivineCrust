import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { 
  getPackaging, 
  savePackaging, 
  deletePackaging, 
  isPackagingUsedInCalculations 
} from '../services/db';

const PACKAGING_CATEGORIES = [
  'Cake Box',
  'Cake Board',
  'Bread Bag',
  'Bread Box',
  'Cupcake Box',
  'Dessert Cup',
  'Sticker',
  'Ribbon',
  'Candle',
  'Cutlery',
  'Other'
];

export default function Packaging({ onRefresh }) {
  const [packaging, setPackaging] = useState([]);
  
  useEffect(() => {
    handleRefresh();
  }, []);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PACKAGING_CATEGORIES[0]);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');

  // Warnings
  const [deleteWarning, setDeleteWarning] = useState(null); // { id, name, usedIn: [] }

  const handleRefresh = async () => {
    try {
      const fresh = await getPackaging();
      setPackaging(fresh);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to load packaging items from API', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setName('');
    setCategory(PACKAGING_CATEGORIES[0]);
    setPurchaseQuantity('');
    setPurchasePrice('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setCategory(pkg.category);
    setPurchaseQuantity(pkg.purchaseQuantity);
    setPurchasePrice(pkg.purchasePrice);
    setNotes(pkg.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !purchaseQuantity || !purchasePrice) {
      alert('Please fill out all required fields.');
      return;
    }

    const pkgData = {
      id: editingPkg ? editingPkg.id : undefined,
      name: name.trim(),
      category,
      purchaseQuantity: parseFloat(purchaseQuantity),
      purchasePrice: parseFloat(purchasePrice),
      notes: notes.trim()
    };

    await savePackaging(pkgData);
    setShowModal(false);
    await handleRefresh();
  };

  const handleDeleteClick = async (pkg) => {
    const usedIn = await isPackagingUsedInCalculations(pkg.id);
    if (usedIn.length > 0) {
      setDeleteWarning({
        id: pkg.id,
        name: pkg.name,
        usedIn
      });
    } else {
      if (confirm(`Are you sure you want to delete packaging item ${pkg.name}?`)) {
        await deletePackaging(pkg.id);
        await handleRefresh();
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteWarning) {
      await deletePackaging(deleteWarning.id);
      setDeleteWarning(null);
      await handleRefresh();
    }
  };

  const filteredPkg = packaging.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory ? p.category === filterCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="packaging-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Packaging</h1>
          <p className="page-subtitle">Master list of cake boxes, boards, bags, stickers, and bakery materials.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Add Packaging Item
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-wrapper">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search packaging..." 
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
          {PACKAGING_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Packaging List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Purchase Price</th>
                <th>Quantity bought</th>
                <th style={{ textAlign: 'right' }}>Cost / Piece</th>
                <th>Notes</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPkg.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No packaging items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPkg.map(pkg => (
                  <tr key={pkg.id}>
                    <td style={{ fontWeight: 600 }}>
                      {pkg.name}
                      {pkg.isDemo && (
                        <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginLeft: '6px' }}>Demo</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-accent">{pkg.category}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{pkg.purchasePrice.toFixed(2)}</td>
                    <td>{pkg.purchaseQuantity} pcs</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-accent)' }}>
                      ₹{pkg.costPerPiece.toFixed(2)} / pc
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pkg.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Edit"
                          onClick={() => handleOpenEdit(pkg)}
                        >
                          <Edit2 size={16} color="var(--text-secondary)" />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Delete"
                          onClick={() => handleDeleteClick(pkg)}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave}>
            <div className="modal-header">
              <h2>{editingPkg ? 'Edit Packaging Item' : 'Add Packaging Item'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '1.25rem' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Cake Box 8 Inch, Bread Bag"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {PACKAGING_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Quantity (pcs) *</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-control" 
                    required 
                    placeholder="e.g. 100, 50"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹) *</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0.01"
                    className="form-control" 
                    required 
                    placeholder="e.g. 350, 1500"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
              </div>

              {purchasePrice && purchaseQuantity && (
                <div className="alert alert-success" style={{ padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <strong>Live Piece Cost:</strong> ₹{(parseFloat(purchasePrice) / parseFloat(purchaseQuantity)).toFixed(2)} / piece
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  placeholder="Additional descriptions (Optional)"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                <AlertTriangle size={24} />
                Cannot Delete Item
              </h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteWarning(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                The packaging item <strong>{deleteWarning.name}</strong> is referenced inside these saved calculations:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', listStyleType: 'disc' }}>
                {deleteWarning.usedIn.map((calcName, idx) => (
                  <li key={idx} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{calcName}</li>
                ))}
              </ul>
              <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong>Warning:</strong> Deleting this item will break the packaging costing breakdown for historical saved cost audits.
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
