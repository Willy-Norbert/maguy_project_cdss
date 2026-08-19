import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import api from '../api/axios';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      api.get('/dashboard/stats')
        .then(res => setPendingCount(res.data.stats?.pendingReview || 0))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  return (
    <div className="app-container">
      <Sidebar pendingCount={pendingCount} />
      <main className="main-content">
        <header className="topbar">
          <span className="topbar-left">
            Antenatal Clinic · Clinical Decision Support
          </span>
          <div className="topbar-right">
            <span className="text-muted">{user?.name}</span>
            <span className="badge badge-neutral">{user?.role}</span>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
