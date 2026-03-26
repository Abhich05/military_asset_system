import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Minus, CheckCircle, AlertTriangle, TrendingDown, Search, Package } from 'lucide-react';
export default function ExpendituresPage() {
  const { user, isAdmin, canWrite } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [eqTypes, setEqTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', date_from: '', date_to: '' });
  const [form, setForm] = useState({ base_id: user?.base_id || '', equipment_type_id: '', quantity: '', reason: '', authorized_by: '', expenditure_date: new Date().toISOString().slice(0, 10) });

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      const { data } = await apiClient.get(`/api/expenditures?${params}`);
      setExpenditures(data.data);
    } catch (err) { setError(err?.response?.data?.error || 'Failed to load expenditures.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    Promise.all([apiClient.get('/api/bases'), apiClient.get('/api/equipment-types')]).then(([b, e]) => {
      setBases(b.data.data); setEqTypes(e.data.data);
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleSubmit(e) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await apiClient.post('/api/expenditures', form);
      setSuccess('Expenditure recorded successfully!');
      setShowModal(false);
      setForm({ base_id: user?.base_id || '', equipment_type_id: '', quantity: '', reason: '', authorized_by: '', expenditure_date: new Date().toISOString().slice(0, 10) });
      fetch();
    } catch (err) { setError(err?.response?.data?.error || 'Failed to record expenditure.'); }
    finally { setSubmitting(false); }
  }

  const totalQty = expenditures.reduce((s,e) => s + Number(e.quantity || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenditures</h1>
          <p className="page-subtitle">Log asset consumption, usage, and write-offs</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setSuccess(''); }} id="btn-new-expenditure">
            <Minus size={16} style={{marginRight: 6}} /> Record Expenditure
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><CheckCircle size={18} /></span>{success}</div>}
      {error   && <div className="alert alert-error"   role="alert"  style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--clr-accent-red)', '--stat-bg': 'rgba(239,68,68,0.10)' }}>
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-value">{expenditures.length}</div>
          <div className="stat-label">Expenditure Records</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--clr-accent-amber)', '--stat-bg': 'rgba(245,158,11,0.10)' }}>
          <div className="stat-icon"><Package size={24} /></div>
          <div className="stat-value">{totalQty.toLocaleString()}</div>
          <div className="stat-label">Total Units Expended</div>
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        {isAdmin && (
          <select id="exp-filter-base" className="form-select" value={filters.base_id} onChange={e => setFilters(f => ({...f, base_id: e.target.value}))} aria-label="Filter by base">
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select id="exp-filter-eq" className="form-select" value={filters.equipment_type_id} onChange={e => setFilters(f => ({...f, equipment_type_id: e.target.value}))} aria-label="Filter by equipment">
          <option value="">All Equipment</option>
          {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input id="exp-filter-from" className="form-input" type="date" value={filters.date_from} onChange={e => setFilters(f => ({...f, date_from: e.target.value}))} aria-label="From date" />
        <input id="exp-filter-to" className="form-input" type="date" value={filters.date_to} onChange={e => setFilters(f => ({...f, date_to: e.target.value}))} aria-label="To date" />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', date_from: '', date_to: '' })} id="exp-filter-clear">Clear</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Expenditure Log</div>
          <div className="card-subtitle">{expenditures.length} records</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Expenditures table">
              <thead>
                <tr><th>Date</th><th>Base</th><th>Equipment</th><th>Qty</th><th>Reason</th><th>Authorized By</th><th>Logged By</th></tr>
              </thead>
              <tbody>
                {expenditures.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon"><TrendingDown size={32} /></div><p className="empty-text">No expenditures found.</p></div></td></tr>
                ) : expenditures.map(ex => (
                  <tr key={ex.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{ex.expenditure_date}</td>
                    <td><strong>{ex.base_name}</strong></td>
                    <td>
                      <div>{ex.equipment_type_name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{ex.category}</div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-accent-red)' }}>−{ex.quantity} {ex.unit}</span></td>
                    <td style={{ color: 'var(--clr-text-secondary)' }}>{ex.reason || '—'}</td>
                    <td style={{ color: 'var(--clr-text-secondary)' }}>{ex.authorized_by || '—'}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{ex.created_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="exp-modal-title" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="exp-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingDown size={20} /> Record Expenditure</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error"><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-base">Base *</label>
                    <select id="exp-base" className="form-select" value={form.base_id} onChange={e => setForm(f => ({...f, base_id: e.target.value}))} required disabled={!isAdmin} aria-required="true">
                      <option value="">Select Base</option>
                      {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-eq">Equipment *</label>
                    <select id="exp-eq" className="form-select" value={form.equipment_type_id} onChange={e => setForm(f => ({...f, equipment_type_id: e.target.value}))} required aria-required="true">
                      <option value="">Select Equipment</option>
                      {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-qty">Quantity *</label>
                    <input id="exp-qty" className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} required placeholder="e.g. 10" aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-date">Date</label>
                    <input id="exp-date" className="form-input" type="date" value={form.expenditure_date} onChange={e => setForm(f => ({...f, expenditure_date: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-auth">Authorized By</label>
                    <input id="exp-auth" className="form-input" type="text" value={form.authorized_by} onChange={e => setForm(f => ({...f, authorized_by: e.target.value}))} placeholder="Officer name / rank" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="exp-reason">Reason *</label>
                  <textarea id="exp-reason" className="form-textarea" value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="e.g. Live fire exercise, training, operational use…" required aria-required="true" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="exp-submit" type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><Minus size={16} style={{marginRight: 6}} /> Record Expenditure</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
