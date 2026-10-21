import React, { useState, useEffect } from 'react';
import './calc.css';
import { supabase } from '../../lib/supabase';
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  ChefHat, 
  Cake, 
  Croissant, 
  Layers, 
  Package, 
  Calculator, 
  Settings as SettingsIcon 
} from 'lucide-react';

// Import components
import Dashboard from './components/Dashboard';
import Ingredients from './components/Ingredients';
import Recipes from './components/Recipes';
import Cakes from './components/Cakes';
import Breads from './components/Breads';
import Chocolate from './components/Chocolate';
import Packaging from './components/Packaging';
import PriceCalculator from './components/PriceCalculator';
import Settings from './components/Settings';

// Import database helpers
import { 
  initializeDatabase, 
  getIngredients, 
  getRecipes, 
  getSavedCalculations 
} from './services/db';

function CalcInner() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Trigger actions (e.g. quick actions)
  const [triggerAction, setTriggerAction] = useState(null);

  // States to pass counts to Dashboard
  const [ingredientsCount, setIngredientsCount] = useState(0);
  const [recipesCount, setRecipesCount] = useState(0);
  const [calculations, setCalculations] = useState([]);
  
  // Shared state for calculation edits
  const [editingCalculation, setEditingCalculation] = useState(null);
  
  // Universal Calculator tab focus
  const [calcTabFocus, setCalcTabFocus] = useState('calculator');

  // Initialize DB on mount
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await refreshStats();
    };
    init();
  }, []);

  const refreshStats = async () => {
    try {
      const ings = await getIngredients();
      const recs = await getRecipes();
      const calcs = await getSavedCalculations();
      setIngredientsCount(ings.length);
      setRecipesCount(recs.length);
      setCalculations(calcs);
    } catch (e) {
      console.error('Failed to load database stats from Express API', e);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSidebarOpen(false);
    
    // Clear editing state if navigating away manually
    if (newPage !== 'cakes' && newPage !== 'breads' && newPage !== 'chocolate' && newPage !== 'price-calculator') {
      setEditingCalculation(null);
    }
  };

  // Callback to load calculation for editing
  const handleLoadCalculation = (calc) => {
    setEditingCalculation(calc);
    if (calc.productType === 'Cake') {
      setPage('cakes');
    } else if (calc.productType === 'Bread') {
      setPage('breads');
    } else if (calc.productType === 'Chocolate') {
      setPage('chocolate');
    } else {
      setCalcTabFocus('calculator');
      setPage('price-calculator');
    }
    setSidebarOpen(false);
  };

  // Callback when a quick action is clicked on the Dashboard
  const handleTriggerAction = (actionType, data = null) => {
    if (actionType === 'add-ingredient') {
      setPage('ingredients');
      // Pass a signal to open add modal
      setTimeout(() => {
        const addBtn = document.querySelector('.ingredients-page .page-header button');
        if (addBtn) addBtn.click();
      }, 100);
    } else if (actionType === 'add-recipe') {
      setPage('recipes');
      // Pass a signal to open add builder
      setTimeout(() => {
        const addBtn = document.querySelector('.recipes-page .page-header button');
        if (addBtn) addBtn.click();
      }, 100);
    } else if (actionType === 'view-calculation' && data) {
      handleLoadCalculation(data);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ingredients', label: 'Ingredients', icon: ShoppingBag },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'cakes', label: 'Cakes', icon: Cake },
    { id: 'breads', label: 'Breads', icon: Croissant },
    { id: 'chocolate', label: 'Chocolate', icon: Layers },
    { id: 'packaging', label: 'Packaging', icon: Package },
    { id: 'price-calculator', label: 'Price Calculator', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <div className="app-container">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="sidebar-title" style={{ fontSize: '1.1rem' }}>D's Divine Crust</span>
          <span className="sidebar-subtitle" style={{ fontSize: '0.65rem' }}>Baking Costing</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar - Desktop and mobile sliding drawer */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">D's Divine Crust</span>
          <span className="sidebar-subtitle">Bakery Costing Sheet</span>
        </div>
        
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button 
                    className={`sidebar-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <IconComponent />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div style={{ padding: '1rem', display: 'grid', gap: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <a className="sidebar-item" href="/admin" style={{ textDecoration: 'none' }}>← Menu admin</a>
          <button className="sidebar-item" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 90, cursor: 'pointer' }} 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Pane */}
      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard 
            ingredientsCount={ingredientsCount}
            recipesCount={recipesCount}
            calculations={calculations}
            setPage={handlePageChange}
            onTriggerAction={handleTriggerAction}
          />
        )}
        
        {page === 'ingredients' && (
          <Ingredients onRefresh={refreshStats} />
        )}
        
        {page === 'recipes' && (
          <Recipes onRefresh={refreshStats} />
        )}
        
        {page === 'cakes' && (
          <Cakes 
            onRefresh={refreshStats} 
            editingCalculation={editingCalculation}
          />
        )}
        
        {page === 'breads' && (
          <Breads 
            onRefresh={refreshStats} 
            editingCalculation={editingCalculation}
          />
        )}
        
        {page === 'chocolate' && (
          <Chocolate onRefresh={refreshStats} />
        )}
        
        {page === 'packaging' && (
          <Packaging onRefresh={refreshStats} />
        )}
        
        {page === 'price-calculator' && (
          <PriceCalculator 
            activeTab={calcTabFocus}
            onRefresh={refreshStats}
            onLoadCalculation={handleLoadCalculation}
            editingCalculation={editingCalculation}
          />
        )}
        
        {page === 'settings' && (
          <Settings onRefresh={refreshStats} />
        )}
      </main>
    </div>
  );
}

// Only the signed-in admin can see the calculator; everyone else is sent to the admin login.
export default function CalcApp() {
  const [state, setState] = useState('checking'); // checking | ok | off

  useEffect(() => {
    if (!supabase) {
      setState('off');
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setState('ok');
      else window.location.replace('/admin');
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) window.location.replace('/admin');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (state === 'off') {
    return <p style={{ padding: '2rem' }}>Supabase is not connected. See SUPABASE_SETUP.md.</p>;
  }
  return state === 'ok' ? <CalcInner /> : null;
}
