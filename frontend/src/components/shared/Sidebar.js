import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Database, ShoppingCart, ArrowRightLeft, 
  TrendingDown, Users, Brain, ShieldAlert, UsersRound, 
  LogOut, Sword 
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/assets',    icon: <Database size={20} />, label: 'Asset Inventory' },
  { to: '/purchases', icon: <ShoppingCart size={20} />, label: 'Purchases' },
  { to: '/transfers', icon: <ArrowRightLeft size={20} />, label: 'Transfers' },
  { to: '/expenditures', icon: <TrendingDown size={20} />, label: 'Expenditures' },
  { to: '/assignments',  icon: <Users size={20} />, label: 'Assignments' },
  { to: '/ai',        icon: <Brain size={20} />, label: 'AI Insights' },
];

const adminNavItems = [
  { to: '/audit-log', icon: <ShieldAlert size={20} />, label: 'Audit Log' },
  { to: '/users',     icon: <UsersRound size={20} />, label: 'Users' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  const roleColorMap = {
    Admin: 'badge-red',
    BaseCommander: 'badge-amber',
    LogisticsOfficer: 'badge-blue'
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true"><Sword size={24} /></div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">MAMS</span>
          <span className="sidebar-logo-sub">Asset Command</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Operations</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <span className="sidebar-section-label" style={{ marginTop: 'var(--sp-2)' }}>Admin</span>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">
              <span className={`badge ${roleColorMap[user?.role] || 'badge-gray'}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
