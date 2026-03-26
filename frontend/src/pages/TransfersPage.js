import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { ArrowRightLeft, CheckCircle, AlertTriangle, Search, Lock } from 'lucide-react';
export default function TransfersPage() {
  const { user, isAdmin, canWrite } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [eqTypes, setEqTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', status: '', date_from: '', date_to: '' });
  const [form, setForm] = useState({ from_base_id: user?.base_id || '', to_base_id: '', equipment_type_id: '', quantity: '', notes: '', transfer_date: new Date().toISOString().slice(0, 10) });

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      const { data } = await apiClient.get(`/api/transfers?${params}`);
      setTransfers(data.data);
    } catch (err) { setError(err?.response?.data?.error || 'Failed to load transfers.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    async function init() {
      const [bRes, eRes] = await Promise.all([apiClient.get('/api/bases'), apiClient.get('/api/equipment-types')]);
      setBases(bRes.data.data); setEqTypes(eRes.data.data);
    }
    init();
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleSubmit(e) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await apiClient.post('/api/transfers', form);
      setSuccess('Transfer completed successfully!');
      setShowModal(false);
      setForm({ from_base_id: user?.base_id || '', to_base_id: '', equipment_type_id: '', quantity: '', notes: '', transfer_date: new Date().toISOString().slice(0, 10) });
      fetch();
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create transfer.'); }
    finally { setSubmitting(false); }
  }

  const statusColors = { Completed: 'badge-green', Pending: 'badge-amber', Cancelled: 'badge-red' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Transfers</h1>
          <p className="page-subtitle">Move equipment between military installations</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setSuccess(''); }} id="btn-new-transfer">
            <ArrowRightLeft size={16} style={{marginRight: 6}} /> New Transfer
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><CheckCircle size={18} /></span>{success}</div>}
      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="filter-bar">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        {isAdmin && (
          <select id="transfer-filter-base" className="form-select" value={filters.base_id} onChange={e => setFilters(f => ({...f, base_id: e.target.value}))} aria-label="Filter by base">
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select id="transfer-filter-eq" className="form-select" value={filters.equipment_type_id} onChange={e => setFilters(f => ({...f, equipment_type_id: e.target.value}))} aria-label="Filter by equipment">
          <option value="">All Equipment</option>
          {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select id="transfer-filter-status" className="form-select" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} aria-label="Filter by status">
          <option value="">All Status</option>
          <option>Completed</option><option>Pending</option><option>Cancelled</option>
        </select>
        <input id="transfer-filter-from" className="form-input" type="date" value={filters.date_from} onChange={e => setFilters(f => ({...f, date_from: e.target.value}))} aria-label="From date" />
        <input id="transfer-filter-to" className="form-input" type="date" value={filters.date_to} onChange={e => setFilters(f => ({...f, date_to: e.target.value}))} aria-label="To date" />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ base_id: isAdmin ? '' : user?.base_id || '', equipment_type_id: '', status: '', date_from: '', date_to: '' })} id="transfer-filter-clear">Clear</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Transfer Records</div>
          <div className="card-subtitle">{transfers.length} records</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Transfers table">
              <thead>
                <tr>
                  <th>Date</th><th>From</th><th>To</th><th>Equipment</th><th>Qty</th><th>Status</th><th>Notes</th><th>By</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><ArrowRightLeft size={32} /></div><p className="empty-text">No transfers found.</p></div></td></tr>
                ) : transfers.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t.transfer_date}</td>
                    <td>
                      <div><strong>{t.from_base_name}</strong></div>
                      <div className="flex-gap-2"><SecurityBadge level={t.from_security_level} /></div>
                    </td>
                    <td>
                      <div><strong>{t.to_base_name}</strong></div>
                      <div className="flex-gap-2"><SecurityBadge level={t.to_security_level} /></div>
                    </td>
                    <td>
                      <div>{t.equipment_type_name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t.category}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.quantity} {t.unit}</td>
                    <td><span className={`badge ${statusColors[t.status] || 'badge-gray'}`}>{t.status}</span></td>
                    <td style={{ color: 'var(--clr-text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t.created_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="transfer-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ArrowRightLeft size={20} /> New Asset Transfer</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error"><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}
                <div className="alert alert-warning" role="note">
                  <span className="alert-icon"><AlertTriangle size={18} /></span>
                  <span>Stock will be deducted from the source base immediately upon completion.</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="transfer-from">From Base *</label>
                    <select id="transfer-from" className="form-select" value={form.from_base_id} onChange={e => setForm(f => ({...f, from_base_id: e.target.value}))} required disabled={!isAdmin} aria-required="true">
                      <option value="">Select Source</option>
                      {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transfer-to">To Base *</label>
                    <select id="transfer-to" className="form-select" value={form.to_base_id} onChange={e => setForm(f => ({...f, to_base_id: e.target.value}))} required aria-required="true">
                      <option value="">Select Destination</option>
                      {bases.filter(b => String(b.id) !== String(form.from_base_id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transfer-eq">Equipment *</label>
                    <select id="transfer-eq" className="form-select" value={form.equipment_type_id} onChange={e => setForm(f => ({...f, equipment_type_id: e.target.value}))} required aria-required="true">
                      <option value="">Select Equipment</option>
                      {eqTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transfer-qty">Quantity *</label>
                    <input id="transfer-qty" className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} required placeholder="e.g. 10" aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transfer-date">Transfer Date</label>
                    <input id="transfer-date" className="form-input" type="date" value={form.transfer_date} onChange={e => setForm(f => ({...f, transfer_date: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="transfer-notes">Notes</label>
                  <textarea id="transfer-notes" className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Reason for transfer…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="transfer-submit" type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Processing…</> : <><ArrowRightLeft size={16} style={{marginRight: 6}} /> Execute Transfer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityBadge({ level }) {
  const labels = { 1: 'LOW', 2: 'MED', 3: 'HIGH' };
  return <span className={`security-badge sec-${level}`} style={{ display: 'inline-flex', alignItems: 'center' }}><Lock size={12} style={{marginRight: 4}} /> {labels[level] || level}</span>;
}
