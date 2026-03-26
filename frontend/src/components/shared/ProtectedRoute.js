import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="main-content flex-center" style={{ minHeight: '100vh' }}>
        <div className="empty-state">
          <div className="empty-icon"><Lock size={32} /></div>
          <h2 className="empty-title">Access Denied</h2>
          <p className="empty-text">Your role ({user.role}) does not have permission to access this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
