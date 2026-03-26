import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckCircle, AlertTriangle, Search, Users, Check } from 'lucide-react';
export default function AssignmentsPage() {
  const { user, isAdmin, isCommander } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterBase, setFilterBase] = useState(isAdmin ? '' : user?.base_id || '');
  const [form, setForm] = useState({ asset_id: '', assigned_to: '', unit: '', quantity: 1, assignment_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '' });

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = filterBase ? `?base_id=${filterBase}` : '';
      const { data } = await apiClient.get(`/api/assignments${params}`);
      setAssignments(data.data);
    } catch (err) { setError(err?.response?.data?.error || 'Failed to load assignments.'); }
    finally { setLoading(false); }
  }, [filterBase]);

  useEffect(() => {
    Promise.all([apiClient.get('/api/bases'), apiClient.get(`/api/assets${!isAdmin ? `?base_id=${user?.base_id}` : ''}`)]).then(([b, a]) => {
      setBases(b.data.data); setAssets(a.data.data);
    });
  }, [isAdmin, user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleSubmit(e) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await apiClient.post('/api/assignments', form);
      setSuccess('Assignment created!');
      setShowModal(false);
      setForm({ asset_id: '', assigned_to: '', unit: '', quantity: 1, assignment_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '' });
      fetch();
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create assignment.'); }
    finally { setSubmitting(false); }
  }

  const canCreate = isAdmin || isCommander;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">Track asset assignments to personnel and units</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setSuccess(''); }} id="btn-new-assignment">
            <Plus size={16} style={{marginRight: 6}} /> New Assignment
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><CheckCircle size={18} /></span>{success}</div>}
      {error   && <div className="alert alert-error"   role="alert"  style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="filter-bar">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        {isAdmin && (
          <select id="assign-filter-base" className="form-select" value={filterBase} onChange={e => setFilterBase(e.target.value)} aria-label="Filter by base">
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => setFilterBase(isAdmin ? '' : user?.base_id || '')} id="assign-filter-clear">Clear</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Assignment Records</div>
          <div className="card-subtitle">{assignments.length} records</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Assignments table">
              <thead>
                <tr><th>Date</th><th>Base</th><th>Equipment</th><th>Assigned To</th><th>Unit</th><th>Qty</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><Users size={32} /></div><p className="empty-text">No assignments found.</p></div></td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{a.assignment_date}</td>
                    <td>{a.base_name}</td>
                    <td>{a.equipment_type_name}</td>
                    <td><strong>{a.assigned_to}</strong></td>
                    <td style={{ color: 'var(--clr-text-secondary)' }}>{a.unit || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{a.quantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{a.due_date || '—'}</td>
                    <td>
                      {a.returned_date
                        ? <span className="badge badge-green">Returned</span>
                        : <span className="badge badge-amber">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="assign-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={20} /> New Assignment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error"><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-asset">Asset *</label>
                    <select id="assign-asset" className="form-select" value={form.asset_id} onChange={e => setForm(f => ({...f, asset_id: e.target.value}))} required aria-required="true">
                      <option value="">Select Asset</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.base_name} – {a.equipment_type_name} (Qty: {a.quantity})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-qty">Quantity</label>
                    <input id="assign-qty" className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-to">Assigned To *</label>
                    <input id="assign-to" className="form-input" type="text" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} required placeholder="Name or ID" aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-unit">Unit / Department</label>
                    <input id="assign-unit" className="form-input" type="text" value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} placeholder="e.g. Alpha Company" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-date">Assignment Date</label>
                    <input id="assign-date" className="form-input" type="date" value={form.assignment_date} onChange={e => setForm(f => ({...f, assignment_date: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assign-due">Due Date</label>
                    <input id="assign-due" className="form-input" type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="assign-notes">Notes</label>
                  <textarea id="assign-notes" className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Purpose or additional context…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="assign-submit" type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><Check size={16} style={{marginRight: 6}} /> Create Assignment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
