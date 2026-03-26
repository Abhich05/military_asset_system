import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { AlertTriangle, Database, Package, Search, PackageOpen, Lock } from 'lucide-react';

export default function AssetInventoryPage() {
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [eqTypes, setEqTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [bRes, eRes] = await Promise.all([apiClient.get('/api/bases'), apiClient.get('/api/equipment-types')]);
        setBases(bRes.data.data); setEqTypes(eRes.data.data);
      } catch (e) { setError('Failed to load reference data.'); }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams();
        if (filterBase) params.set('base_id', filterBase);
        if (filterCategory) params.set('category', filterCategory);
        const { data } = await apiClient.get(`/api/assets?${params}`);
        setAssets(data.data);
      } catch (err) { setError(err?.response?.data?.error || 'Failed to load assets.'); }
      finally { setLoading(false); }
    }
    fetchAssets();
  }, [filterBase, filterCategory]);

  const categories = [...new Set(eqTypes.map(e => e.category))];
  const totalQty = assets.reduce((s, a) => s + Number(a.quantity || 0), 0);
  const lowStockCount = assets.filter(a => a.quantity < 20).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Inventory</h1>
          <p className="page-subtitle">Current asset balances across all installations</p>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--clr-primary)', '--stat-bg': 'rgba(59,130,246,0.10)' }}>
          <div className="stat-icon"><Database size={24} /></div>
          <div className="stat-value">{assets.length}</div>
          <div className="stat-label">Asset Lines</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--clr-accent-green)', '--stat-bg': 'rgba(16,185,129,0.10)' }}>
          <div className="stat-icon"><Package size={24} /></div>
          <div className="stat-value">{totalQty.toLocaleString()}</div>
          <div className="stat-label">Total Units</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--clr-accent-red)', '--stat-bg': 'rgba(239,68,68,0.10)' }}>
          <div className="stat-icon"><AlertTriangle size={24} /></div>
          <div className="stat-value">{lowStockCount}</div>
          <div className="stat-label">Low Stock (&lt;20)</div>
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        <select id="inv-filter-base" className="form-select" value={filterBase} onChange={e => setFilterBase(e.target.value)} aria-label="Filter by base">
          <option value="">All Bases</option>
          {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select id="inv-filter-category" className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterBase(''); setFilterCategory(''); }} id="inv-filter-clear">Clear</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Current Asset Balances</div>
          <div className="card-subtitle">{assets.length} records</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading inventory…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Asset inventory table">
              <thead>
                <tr><th>Base</th><th>Security</th><th>Equipment</th><th>Category</th><th>SKU</th><th>Unit</th><th>Quantity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><PackageOpen size={32} /></div><p className="empty-text">No assets match filters.</p></div></td></tr>
                ) : assets.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.base_name}</strong></td>
                    <td><span className={`security-badge sec-${a.security_level}`} style={{ display: 'inline-flex', alignItems: 'center' }}><Lock size={12} style={{marginRight: 4}} /> {['','LOW','MED','HIGH'][a.security_level] || a.security_level}</span></td>
                    <td>{a.equipment_type_name}</td>
                    <td><span className="badge badge-purple">{a.category}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{a.sku || '—'}</td>
                    <td style={{ color: 'var(--clr-text-secondary)' }}>{a.unit}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        color: a.quantity < 10 ? 'var(--clr-accent-red)'
                          : a.quantity < 20 ? 'var(--clr-accent-amber)'
                          : 'var(--clr-text-primary)'
                      }}>{a.quantity.toLocaleString()}</span>
                    </td>
                    <td>
                      {a.quantity === 0 ? <span className="badge badge-red">Empty</span>
                        : a.quantity < 20 ? <span className="badge badge-amber">Low</span>
                        : <span className="badge badge-green">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
