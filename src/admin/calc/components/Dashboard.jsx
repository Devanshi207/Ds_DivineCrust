import React from 'react';
import { 
  PlusCircle, 
  ChefHat, 
  Cake, 
  Croissant, 
  Calculator, 
  ShoppingBag, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

export default function Dashboard({ 
  ingredientsCount, 
  recipesCount, 
  calculations, 
  setPage, 
  onTriggerAction 
}) {
  const cakeCalcs = calculations.filter(c => c.productType === 'Cake').length;
  const breadCalcs = calculations.filter(c => c.productType === 'Bread').length;
  
  // Get last 3 calculations
  const recentCalcs = [...calculations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const stats = [
    { title: 'Total Ingredients', value: ingredientsCount, icon: ShoppingBag, color: 'var(--color-accent)' },
    { title: 'Total Recipes', value: recipesCount, icon: ChefHat, color: 'var(--color-gold)' },
    { title: 'Cakes Calculated', value: cakeCalcs, icon: Cake, color: '#C85A32' },
    { title: 'Breads Calculated', value: breadCalcs, icon: Croissant, color: '#5C4A3F' }
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back to D's Divine Crust kitchen notebook!</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              backgroundColor: stat.color + '15',
              color: stat.color,
              padding: '0.75rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.title}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }} className="grid-cols-2">
        {/* Recent Calculations */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--color-accent)" />
            Recent Costings
          </h2>
          {recentCalcs.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              <Calculator size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No calculations saved yet.</p>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '0.75rem' }}
                onClick={() => setPage('cakes')}
              >
                Start First Cake
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Cost</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalcs.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => onTriggerAction('view-calculation', c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{c.productName}</td>
                      <td>
                        <span className={`badge ${
                          c.productType === 'Cake' ? 'badge-accent' : 
                          c.productType === 'Bread' ? 'badge-success' : 'badge-gold'
                        }`}>
                          {c.productType}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{c.totalCost.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>
                        ₹{c.sellingPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setPage('price-calculator')}
                  style={{ fontWeight: 600, color: 'var(--color-accent)' }}
                >
                  View All Saved Calculations
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => onTriggerAction('add-ingredient')}
            >
              <PlusCircle size={18} color="var(--color-accent)" />
              Add Ingredient
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => onTriggerAction('add-recipe')}
            >
              <PlusCircle size={18} color="var(--color-gold)" />
              Add Recipe
            </button>
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => setPage('cakes')}
            >
              <Cake size={18} />
              Calculate Cake Cost
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ 
                justifyContent: 'flex-start', 
                width: '100%',
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success)',
                borderColor: 'transparent'
              }}
              onClick={() => setPage('breads')}
            >
              <Croissant size={18} />
              Calculate Bread Cost
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ 
                justifyContent: 'flex-start', 
                width: '100%',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                color: '#A88418',
                borderColor: 'transparent'
              }}
              onClick={() => setPage('chocolate')}
            >
              <Layers size={18} />
              Calculate Chocolate Cost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
