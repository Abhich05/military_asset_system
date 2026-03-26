import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckCircle, AlertTriangle, ClipboardList, Package, DollarSign, Search, PackageOpen, Check } from 'lucide-react';
export default function PurchasesPage() {
  const { user, isAdmin, canWrite } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [eqTypes, setEqTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', date_from: '', date_to: '' });
  const [form, setForm] = useState({ base_id: user?.base_id || '', equipment_type_id: '', quantity: '', unit_cost: '', vendor: '', notes: '', purchase_date: new Date().toISOString().slice(0, 10) });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      const { data } = await apiClient.get(`/api/purchases?${params}`);
      setPurchases(data.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load purchases.');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    async function init() {
      const [bRes, eRes] = await Promise.all([apiClient.get('/api/bases'), apiClient.get('/api/equipment-types')]);
      setBases(bRes.data.data);
      setEqTypes(eRes.data.data);
    }
    init();
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/purchases', form);
      setSuccess('Purchase recorded successfully!');
      setShowModal(false);
      setForm({ base_id: user?.base_id || '', equipment_type_id: '', quantity: '', unit_cost: '', vendor: '', notes: '', purchase_date: new Date().toISOString().slice(0, 10) });
      fetchPurchases();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to record purchase.');
    } finally { setSubmitting(false); }
  }

  const totalValue = purchases.reduce((s, p) => s + Number(p.total_value || 0), 0);
  const totalQty = purchases.reduce((s, p) => s + Number(p.quantity || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Record and track equipment procurement</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setSuccess(''); }} id="btn-new-purchase" aria-haspopup="dialog">
            <Plus size={16} style={{marginRight: 6}} /> New Purchase
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><CheckCircle size={18} /></span>{success}</div>}
      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <MiniStat label="Total Records" value={purchases.length} icon={<ClipboardList size={24} />} />
        <MiniStat label="Total Quantity" value={totalQty.toLocaleString()} icon={<Package size={24} />} />
        <MiniStat label="Total Value" value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign size={24} />} />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        {isAdmin && (
          <select id="purchase-filter-base" className="form-select" value={filters.base_id} onChange={e => setFilters(f => ({ ...f, base_id: e.target.value }))} aria-label="Filter by base">
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select id="purchase-filter-eq" className="form-select" value={filters.equipment_type_id} onChange={e => setFilters(f => ({ ...f, equipment_type_id: e.target.value }))} aria-label="Filter by equipment">
          <option value="">All Equipment</option>
          {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input id="purchase-filter-from" className="form-input" type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} aria-label="From date" />
        <input id="purchase-filter-to" className="form-input" type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} aria-label="To date" />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', date_from: '', date_to: '' })} id="purchase-filter-clear">Clear</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Purchase History</div>
          <div className="card-subtitle">{purchases.length} records</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Purchases table">
              <thead>
                <tr>
                  <th>Date</th><th>Base</th><th>Equipment</th><th>Qty</th>
                  <th>Unit Cost</th><th>Total Value</th><th>Vendor</th><th>By</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><PackageOpen size={32} /></div><p className="empty-text">No purchases found.</p></div></td></tr>
                ) : purchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{p.purchase_date}</td>
                    <td><strong>{p.base_name}</strong></td>
                    <td>
                      <div>{p.equipment_type_name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{p.category}</div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.quantity} {p.unit}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-text-secondary)' }}>${Number(p.unit_cost).toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--clr-accent-green)' }}>${Number(p.total_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td style={{ color: 'var(--clr-text-secondary)' }}>{p.vendor || '—'}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{p.created_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="purchase-modal-title" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="purchase-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Package size={20} /> Record Purchase</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error"><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-base">Base *</label>
                    <select id="purchase-base" className="form-select" value={form.base_id} onChange={e => setForm(f => ({ ...f, base_id: e.target.value }))} required disabled={!isAdmin} aria-required="true">
                      <option value="">Select Base</option>
                      {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-eq">Equipment Type *</label>
                    <select id="purchase-eq" className="form-select" value={form.equipment_type_id} onChange={e => setForm(f => ({ ...f, equipment_type_id: e.target.value }))} required aria-required="true">
                      <option value="">Select Equipment</option>
                      {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-qty">Quantity *</label>
                    <input id="purchase-qty" className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="e.g. 50" aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-cost">Unit Cost ($)</label>
                    <input id="purchase-cost" className="form-input" type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-vendor">Vendor</label>
                    <input id="purchase-vendor" className="form-input" type="text" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="purchase-date">Date</label>
                    <input id="purchase-date" className="form-input" type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="purchase-notes">Notes</label>
                  <textarea id="purchase-notes" className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="purchase-submit" type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><Check size={16} style={{marginRight: 6}} /> Record Purchase</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="stat-card" style={{ '--stat-color': 'var(--clr-primary)', '--stat-bg': 'rgba(59,130,246,0.10)' }}>
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
