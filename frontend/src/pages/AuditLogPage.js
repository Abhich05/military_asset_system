import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { AlertTriangle, ClipboardList } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/api/audit-log').then(({ data }) => {
      setLogs(data.data); setLoading(false);
    }).catch(err => {
      setError(err?.response?.data?.error || 'Failed to load audit log.'); setLoading(false);
    });
  }, []);

  const actionColors = {
    CREATE: 'badge-green', DELETE: 'badge-red', UPDATE: 'badge-amber'
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete record of all write operations — immutable trail</p>
        </div>
        <span className="badge badge-red">Admin Only</span>
      </div>

      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-4)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">System Audit Trail</div>
          <div className="card-subtitle">Last 200 entries</div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading audit log…</span></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Audit log table">
              <thead>
                <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th><th>Details</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon"><ClipboardList size={32} /></div><p className="empty-text">No audit entries yet.</p></div></td></tr>
                ) : logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap' }}>{l.created_at}</td>
                    <td><strong>{l.actor || 'system'}</strong></td>
                    <td><span className={`badge ${actionColors[l.action] || 'badge-gray'}`}>{l.action}</span></td>
                    <td><span className="badge badge-blue">{l.entity_type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-text-muted)' }}>#{l.entity_id || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{l.ip_address || '—'}</td>
                    <td>
                      <details>
                        <summary style={{ cursor: 'pointer', fontSize: 'var(--fs-xs)', color: 'var(--clr-primary)' }}>View</summary>
                        <pre style={{ marginTop: 4, fontSize: '0.65rem', color: 'var(--clr-text-muted)', maxWidth: 280, overflow: 'auto', background: 'var(--clr-bg-base)', padding: 'var(--sp-2)', borderRadius: 'var(--radius-sm)' }}>
                          {JSON.stringify(JSON.parse(l.metadata || '{}'), null, 2)}
                        </pre>
                      </details>
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
