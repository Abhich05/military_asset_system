import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const breadcrumbMap = {
  '/dashboard':    'Dashboard',
  '/assets':       'Asset Inventory',
  '/purchases':    'Purchases',
  '/transfers':    'Transfers',
  '/expenditures': 'Expenditures',
  '/assignments':  'Assignments',
  '/ai':           'AI Insights',
  '/audit-log':    'Audit Log',
  '/users':        'User Management',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = breadcrumbMap[pathname] || 'Dashboard';
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="header" role="banner">
      <div className="header-breadcrumb" aria-label="Breadcrumb">
        <span>MAMS</span>
        <span className="header-breadcrumb-sep">›</span>
        <span className="header-breadcrumb-current">{page}</span>
      </div>

      <div className="header-actions">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', textAlign: 'right' }}>
          <div style={{ color: 'var(--clr-text-secondary)' }}>{time} UTC</div>
          <div>{date}</div>
        </div>
        <div className="header-status" aria-label="System status: Online">
          <span className="status-dot" aria-hidden="true"></span>
          SYSTEM ONLINE
        </div>
        {user?.base_id && (
          <span className="badge badge-blue" aria-label={`Base ID: ${user.base_id}`}>
            Base #{user.base_id}
          </span>
        )}
      </div>
    </header>
  );
}
