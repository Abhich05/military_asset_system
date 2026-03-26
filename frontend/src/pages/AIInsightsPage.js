import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Brain, RefreshCw, Play, AlertTriangle, Package, Zap, CheckCircle, AlertOctagon } from 'lucide-react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function AIInsightsPage() {
  const [baseId, setBaseId] = useState(1);
  const [equipmentTypeId, setEquipmentTypeId] = useState(1);
  const [period, setPeriod] = useState(14);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    return new URLSearchParams({ baseId: String(baseId), equipmentTypeId: String(equipmentTypeId), period: String(period) }).toString();
  }, [baseId, equipmentTypeId, period]);

  async function load() {
    setLoading(true); setError('');
    try {
      const [fRes, aRes, rRes] = await Promise.all([
        apiClient.get(`/ai/forecast?${queryString}&historyDays=60`),
        apiClient.get(`/ai/alerts?baseId=${baseId}&days=${Math.max(14, period * 2)}`),
        apiClient.get(`/ai/recommend-purchase?baseId=${baseId}&equipmentTypeId=${equipmentTypeId}&period=${period}`)
      ]);
      setForecast(fRes.data);
      setAlerts(aRes.data.alerts || []);
      setRecommendation(rRes.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load AI insights.');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Chart: history + forecast
  const historyLabels = (forecast?.history || []).map(h => h.date);
  const forecastLabels = (forecast?.forecast || []).map(f => f.date);
  const allLabels = [...historyLabels, ...forecastLabels];

  const historyValues = (forecast?.history || []).map(h => h.value);
  const forecastValues = Array(historyLabels.length).fill(null).concat((forecast?.forecast || []).map(f => f.value));

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Historical Demand',
        data: historyValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
      {
        label: `Forecast (${period}d)`,
        data: forecastValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#8ba3bf', font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
      tooltip: { backgroundColor: '#0d1421', titleColor: '#f0f4f8', bodyColor: '#8ba3bf', borderColor: '#1e3a5f', borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: '#4b6280', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: 'rgba(99,148,201,0.06)' } },
      y: { ticks: { color: '#4b6280', font: { size: 11 } }, grid: { color: 'rgba(99,148,201,0.06)' } },
    }
  };

  const severityMeta = {
    high:   { badge: 'badge-red',   icon: <AlertOctagon size={16} />, label: 'HIGH' },
    medium: { badge: 'badge-amber', icon: <AlertTriangle size={16} />, label: 'MED' },
    low:    { badge: 'badge-green', icon: <CheckCircle size={16} />, label: 'LOW' },
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Brain size={28} /> AI Insights</h1>
          <p className="page-subtitle">Demand forecasting, anomaly alerts, and procurement recommendations</p>
        </div>
        <button id="ai-refresh" className="btn btn-secondary" onClick={load} disabled={loading} aria-label="Refresh AI insights">
          {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading…</> : <><RefreshCw size={14} style={{marginRight: 6}} /> Refresh</>}
        </button>
      </div>

      {/* Parameters */}
      <div className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div className="card-title">Analysis Parameters</div>
        </div>
        <div className="card-body">
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ai-base-id">Base ID</label>
              <input id="ai-base-id" className="form-input" type="number" min="1" value={baseId} onChange={e => setBaseId(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ai-eq-id">Equipment Type ID</label>
              <input id="ai-eq-id" className="form-input" type="number" min="1" value={equipmentTypeId} onChange={e => setEquipmentTypeId(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ai-period">Forecast Period (days)</label>
              <input id="ai-period" className="form-input" type="number" min="1" max="90" value={period} onChange={e => setPeriod(Number(e.target.value))} />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label" style={{ visibility: 'hidden' }}>Run</label>
              <button id="ai-run" className="btn btn-primary" onClick={load} disabled={loading} aria-busy={loading}>
                <Play size={14} style={{marginRight: 6}} /> Run Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-5)' }}><span className="alert-icon"><AlertTriangle size={18} /></span>{error}</div>}

      <div className="dashboard-grid">
        {/* Forecast Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Demand Forecast</div>
              <div className="card-subtitle">Historical trend + {period}-day projection</div>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 300 }}>
              {forecast
                ? <Line data={chartData} options={chartOpts} aria-label="Demand forecast line chart" />
                : <div className="loading-center" aria-live="polite" aria-busy="true"><div className="spinner" /></div>}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={20} /> Purchase Recommendation</div>
            </div>
            <div className="card-body">
              {recommendation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  <RecoRow label="Current Stock" value={recommendation.currentStock} color="var(--clr-text-primary)" />
                  <RecoRow label={`Needed (next ${period}d)`} value={Math.round(recommendation.neededNextPeriod)} color="var(--clr-accent-amber)" />
                  <RecoRow label="Target (10% buffer)" value={Math.round(recommendation.targetStock)} color="var(--clr-accent-cyan)" />
                  <div style={{ height: 1, background: 'var(--clr-border)', margin: 'var(--sp-1) 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>Suggested Purchase</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xl)', fontWeight: 800,
                      color: recommendation.suggestedQuantity > 0 ? 'var(--clr-accent-green)' : 'var(--clr-text-muted)'
                    }}>
                      {recommendation.suggestedQuantity > 0 ? `+${recommendation.suggestedQuantity}` : 'None needed'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>{recommendation.note}</p>
                </div>
              ) : <div className="loading-center"><div className="spinner" /></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={20} /> Anomaly Alerts</div>
            <div className="card-subtitle">{alerts.length} alerts detected</div>
          </div>
        </div>
        <div className="card-body">
          {alerts.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
              <div className="empty-icon"><CheckCircle size={32} /></div>
              <div className="empty-title">No anomalies detected</div>
              <p className="empty-text">All operations are within normal parameters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {alerts.map((alert, i) => {
                const meta = severityMeta[alert.severity] || severityMeta.low;
                return (
                  <div key={i} className={`alert ${alert.severity === 'high' ? 'alert-error' : alert.severity === 'medium' ? 'alert-warning' : 'alert-info'}`} role="alert">
                    <span className="alert-icon">{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'inherit', opacity: 0.7 }}>{alert.date}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', opacity: 0.5 }}>{alert.type}</span>
                      </div>
                      <div style={{ fontWeight: 500 }}>{alert.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
