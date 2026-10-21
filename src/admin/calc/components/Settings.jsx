import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, ShieldCheck, RefreshCw, Trash2, Database } from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  exportDatabaseJSON, 
  importDatabaseJSON,
  seedDemoData,
  clearDemoData 
} from '../services/db';

export default function Settings({ onRefresh }) {
  const [profitMargin, setProfitMargin] = useState(40);
  const [wastagePercentage, setWastagePercentage] = useState(5);
  const [labourRate, setLabourRate] = useState(100);
  const [overheadPercentage, setOverheadPercentage] = useState(5);

  const [savedAlert, setSavedAlert] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // { success: boolean, message: string }

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSettings();
        setProfitMargin(s.profitMargin);
        setWastagePercentage(s.wastagePercentage);
        setLabourRate(s.labourRate);
        setOverheadPercentage(s.overheadPercentage);
      } catch (e) {
        console.error('Failed to load settings from API', e);
      }
    };
    load();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const updated = {
      profitMargin: parseFloat(profitMargin) || 0,
      wastagePercentage: parseFloat(wastagePercentage) || 0,
      labourRate: parseFloat(labourRate) || 0,
      overheadPercentage: parseFloat(overheadPercentage) || 0
    };
    await saveSettings(updated);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
    if (onRefresh) await onRefresh();
  };

  const handleExport = async () => {
    try {
      const dataStr = await exportDatabaseJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ds_divine_crust_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export data: ' + e.message);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const res = await importDatabaseJSON(content);
      if (res.success) {
        setImportStatus({ success: true, message: 'Database backup imported and restored successfully!' });
        if (onRefresh) await onRefresh();
        // Reload fields
        const s = await getSettings();
        setProfitMargin(s.profitMargin);
        setWastagePercentage(s.wastagePercentage);
        setLabourRate(s.labourRate);
        setOverheadPercentage(s.overheadPercentage);
      } else {
        setImportStatus({ success: false, message: 'Import failed: ' + res.error });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const handleLoadDemo = async () => {
    if (confirm('Load Demo Data? This will seed sample ingredients, recipes, and packaging marked as [Demo] for testing.')) {
      await seedDemoData();
      setImportStatus({ success: true, message: 'Demo data loaded successfully!' });
      if (onRefresh) await onRefresh();
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleClearDemo = async () => {
    if (confirm('Clear all Demo Data? This will wipe out all ingredients, recipes, packaging, and calculations tagged with [Demo]. Your custom data remains unchanged.')) {
      await clearDemoData();
      setImportStatus({ success: true, message: 'Demo data wiped successfully!' });
      if (onRefresh) await onRefresh();
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  return (
    <div className="settings-page animate-slideUp">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure default formulas, multipliers, and manage backups.</p>
        </div>
      </div>

      {savedAlert && (
        <div className="alert alert-success animate-slideUp">
          Default parameters successfully saved and synchronized!
        </div>
      )}

      {importStatus && (
        <div className={`alert ${importStatus.success ? 'alert-success' : 'alert-danger'} animate-slideUp`}>
          {importStatus.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }} className="grid-cols-2">
        {/* Left Column: Form parameters */}
        <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Costing & Margin Defaults
          </h3>
          
          <div className="form-group">
            <label className="form-label">Default Target Profit Margin (%)</label>
            <input 
              type="number" 
              className="form-control"
              required 
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              placeholder="e.g. 40"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Used to calculate suggestions: Cost / (1 - Margin/100).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Default Labour Hourly Rate (₹ / hour)</label>
            <input 
              type="number" 
              className="form-control"
              required 
              value={labourRate}
              onChange={(e) => setLabourRate(e.target.value)}
              placeholder="e.g. 100"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Base wage multiplied by prep and decoration hours.
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default Overheads (%)</label>
              <input 
                type="number" 
                className="form-control"
                required 
                value={overheadPercentage}
                onChange={(e) => setOverheadPercentage(e.target.value)}
                placeholder="e.g. 5"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Covers utilities, gas, water.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default Wastage (%)</label>
              <input 
                type="number" 
                className="form-control"
                required 
                value={wastagePercentage}
                onChange={(e) => setWastagePercentage(e.target.value)}
                placeholder="e.g. 5"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Covers batter spills, scrap trim.
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
            <Save size={16} />
            Save Default Parameters
          </button>
        </form>

        {/* Right Column: Database safety backups & Demo controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Demo Controls Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Demo / Sample Data</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Load a sample egg-free catalog (ingredients, sponge/filling recipes, boxes, boards, and demo truffle cake calculations) for instant testing.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1, backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', borderColor: 'transparent' }}
                onClick={handleLoadDemo}
              >
                <Database size={16} />
                Load Demo Data
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1, backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderColor: 'transparent' }}
                onClick={handleClearDemo}
              >
                <Trash2 size={16} />
                Clear Demo Data
              </button>
            </div>
          </div>

          {/* Backup Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Data Safety & Backups</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              All database items are saved in your local browser storage.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)', margin: '0.5rem 0' }}>
              <ShieldCheck size={20} />
              Egg-free Business Rules Enabled
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Export Calculations & Master Lists</label>
                <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExport}>
                  <Download size={16} />
                  Export Data (JSON)
                </button>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Restore Backup File</label>
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={() => document.getElementById('import-file-btn').click()}>
                    <Upload size={16} />
                    Import Backup (JSON File)
                  </button>
                  <input 
                    type="file" 
                    id="import-file-btn" 
                    accept=".json"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
