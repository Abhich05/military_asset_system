import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { RefreshCw, Search, TrendingUp, AlertTriangle, Building, Package, Layers, ArrowRightLeft, BarChart3, PieChart, PackageOpen, Lock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [bases, setBases] = useState([]);
  const [eqTypes, setEqTypes] = useState([]);
  const [filterBase, setFilterBase] = useState(isAdmin ? '' : user?.base_id || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [netMovementModal, setNetMovementModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterBase) params.set('base_id', filterBase);
      if (filterCategory) params.set('category', filterCategory);
      if (filterDateFrom) params.set('date_from', filterDateFrom);
      if (filterDateTo) params.set('date_to', filterDateTo);

      const [sumRes, basesRes, eqRes] = await Promise.all([
        apiClient.get(`/api/dashboard/summary?${params}`),
        apiClient.get('/api/bases'),
        apiClient.get('/api/equipment-types'),
      ]);
      setSummary(sumRes.data.data);
      setBases(basesRes.data.data);
      setEqTypes(eqRes.data.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [filterBase, filterCategory, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = [...new Set(eqTypes.map(e => e.category))];

  // Build bar chart: assets per base
  const baseNames = [...new Set((summary?.assets || []).map(a => a.base_name))];
  const assetByBase = baseNames.map(bn =>
    (summary?.assets || []).filter(a => a.base_name === bn).reduce((s, a) => s + a.quantity, 0)
  );
  const barData = {
    labels: baseNames,
    datasets: [{
      label: 'Total Assets',
      data: assetByBase,
      backgroundColor: CHART_COLORS.map(c => c + '99'),
      borderColor: CHART_COLORS,
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  // Doughnut: by category
  const catMap = {};
  (summary?.assets || []).forEach(a => {
    catMap[a.category] = (catMap[a.category] || 0) + a.quantity;
  });
  const donutData = {
    labels: Object.keys(catMap),
    datasets: [{
      data: Object.values(catMap),
      backgroundColor: CHART_COLORS.map(c => c + 'bb'),
      borderColor: CHART_COLORS,
      borderWidth: 2,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8ba3bf', font: { family: 'Inter', size: 11 } } },
      tooltip: { backgroundColor: '#0d1421', titleColor: '#f0f4f8', bodyColor: '#8ba3bf', borderColor: '#1e3a5f', borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: '#4b6280', font: { size: 11 } }, grid: { color: 'rgba(99,148,201,0.08)' } },
      y: { ticks: { color: '#4b6280', font: { size: 11 } }, grid: { color: 'rgba(99,148,201,0.08)' } },
    }
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8ba3bf', font: { size: 11 }, padding: 12, boxWidth: 12 } },
      tooltip: { backgroundColor: '#0d1421', titleColor: '#f0f4f8', bodyColor: '#8ba3bf', borderColor: '#1e3a5f', borderWidth: 1 },
    }
  };

  const s = summary?.stats || {};
  const movements = summary?.movements || {};

  // Aggregate net movement per equipment type for modal
  const buildNetMovement = () => {
    const map = {};
    (movements.purchases || []).forEach(r => {
      const k = r.equipment_type_id;
      if (!map[k]) map[k] = { eqId: k, purchased: 0, expended: 0, transferIn: 0, transferOut: 0 };
      map[k].purchased += Number(r.total_qty);
    });
    (movements.expenditures || []).forEach(r => {
      const k = r.equipment_type_id;
      if (!map[k]) map[k] = { eqId: k, purchased: 0, expended: 0, transferIn: 0, transferOut: 0 };
      map[k].expended += Number(r.total_qty);
    });
    (movements.transfersIn || []).forEach(r => {
      const k = r.equipment_type_id;
      if (!map[k]) map[k] = { eqId: k, purchased: 0, expended: 0, transferIn: 0, transferOut: 0 };
      map[k].transferIn += Number(r.total_qty);
    });
    (movements.transfersOut || []).forEach(r => {
      const k = r.equipment_type_id;
      if (!map[k]) map[k] = { eqId: k, purchased: 0, expended: 0, transferIn: 0, transferOut: 0 };
      map[k].transferOut += Number(r.total_qty);
    });
    return Object.values(map).map(row => ({
      ...row,
      eqName: eqTypes.find(e => e.id === row.eqId)?.name || `#${row.eqId}`,
      net: row.purchased + row.transferIn - row.expended - row.transferOut
    }));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Real-time asset overview across all military bases</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} aria-label="Refresh dashboard" id="dashboard-refresh">
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar" role="search" aria-label="Dashboard filters">
        <span className="filter-bar-label"><Search size={14} /> Filter:</span>
        {isAdmin && (
          <select
            id="filter-base"
            className="form-select"
            value={filterBase}
            onChange={e => setFilterBase(e.target.value)}
            aria-label="Filter by base"
          >
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select
          id="filter-category"
          className="form-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          id="filter-date-from"
          className="form-input"
          type="date"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          aria-label="Date from"
          title="From date"
        />
        <input
          id="filter-date-to"
          className="form-input"
          type="date"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          aria-label="Date to"
          title="To date"
        />
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterBase(isAdmin ? '' : user?.base_id || ''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }} id="filter-clear">
          Clear
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setNetMovementModal(buildNetMovement())}
          id="btn-net-movement"
          aria-haspopup="dialog"
        >
          <TrendingUp size={14} style={{ marginRight: 6 }} /> Net Movements
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-5)' }}>
          <span className="alert-icon"><AlertTriangle size={18} /></span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-center" aria-live="polite" aria-busy="true">
          <div className="spinner" aria-hidden="true" />
          Loading dashboard data…
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)' }}>
            <StatCard icon={<Building size={24} />} label="Active Bases" value={s.total_bases || 0} color="var(--clr-primary)" bg="rgba(59,130,246,0.12)" />
            <StatCard icon={<Package size={24} />} label="Total Assets" value={Number(s.total_assets || 0).toLocaleString()} color="var(--clr-accent-green)" bg="rgba(16,185,129,0.12)" />
            <StatCard icon={<Layers size={24} />} label="Equipment Types" value={s.equipment_types || 0} color="var(--clr-accent-purple)" bg="rgba(139,92,246,0.12)" />
            <StatCard icon={<ArrowRightLeft size={24} />} label="Pending Transfers" value={s.pending_transfers || 0} color="var(--clr-accent-amber)" bg="rgba(245,158,11,0.12)" />
          </div>

          {/* Charts */}
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Asset Distribution by Base</div>
                  <div className="card-subtitle">Current quantity per installation</div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  {baseNames.length > 0
                    ? <Bar data={barData} options={chartOpts} aria-label="Bar chart showing asset distribution by base" />
                    : <div className="empty-state"><div className="empty-icon"><BarChart3 size={32} /></div><p className="empty-text">No asset data for current filters.</p></div>
                  }
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Assets by Category</div>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  {Object.keys(catMap).length > 0
                    ? <Doughnut data={donutData} options={donutOpts} aria-label="Doughnut chart showing asset breakdown by category" />
                    : <div className="empty-state"><div className="empty-icon"><PieChart size={32} /></div><p className="empty-text">No category data.</p></div>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="card" style={{ marginTop: 'var(--sp-5)' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Inventory Snapshot</div>
                <div className="card-subtitle">{(summary?.assets || []).length} records</div>
              </div>
            </div>
            <div className="table-container">
              <table className="table" aria-label="Asset inventory table">
                <thead>
                  <tr>
                    <th scope="col">Base</th>
                    <th scope="col">Security</th>
                    <th scope="col">Equipment</th>
                    <th scope="col">Category</th>
                    <th scope="col">SKU</th>
                    <th scope="col">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.assets || []).length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state" style={{ padding: 'var(--sp-8)' }}><div className="empty-icon"><PackageOpen size={32} /></div><p className="empty-text">No assets match the current filters.</p></div></td></tr>
                  ) : (
                    (summary?.assets || []).map((a, i) => (
                      <tr key={i}>
                        <td><strong>{a.base_name}</strong></td>
                        <td><SecurityBadge level={a.security_level} /></td>
                        <td>{a.equipment_type_name}</td>
                        <td><span className="badge badge-purple">{a.category}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{a.sku || '—'}</td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: a.quantity < 20 ? 'var(--clr-accent-red)' : 'var(--clr-text-primary)' }}>{a.quantity}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Net Movement Modal */}
      {netMovementModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="net-movement-title" onClick={e => e.target === e.currentTarget && setNetMovementModal(null)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2 className="modal-title" id="net-movement-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={20} /> Net Movement Breakdown</h2>
              <button className="modal-close" onClick={() => setNetMovementModal(null)} aria-label="Close net movements modal">✕</button>
            </div>
            <div className="modal-body">
              <div className="table-container net-movement-table">
                <table className="table" aria-label="Net movement breakdown">
                  <thead>
                    <tr>
                      <th scope="col">Equipment</th>
                      <th scope="col">Purchased</th>
                      <th scope="col">Transfer In</th>
                      <th scope="col">Expended</th>
                      <th scope="col">Transfer Out</th>
                      <th scope="col">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netMovementModal.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: 'var(--sp-8)' }}>No movement data for this period.</td></tr>
                    ) : netMovementModal.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.eqName}</strong></td>
                        <td className="value-positive">+{r.purchased}</td>
                        <td className="value-positive">+{r.transferIn}</td>
                        <td className="value-negative">-{r.expended}</td>
                        <td className="value-negative">-{r.transferOut}</td>
                        <td>
                          <span className={r.net >= 0 ? 'value-positive' : 'value-negative'}>
                            {r.net >= 0 ? '+' : ''}{r.net}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SecurityBadge({ level }) {
  const labels = { 1: 'LOW', 2: 'MED', 3: 'HIGH' };
  return <span className={`security-badge sec-${level}`} style={{ display: 'inline-flex', alignItems: 'center' }}><Lock size={12} style={{marginRight: 4}} /> {labels[level] || level}</span>;
}
