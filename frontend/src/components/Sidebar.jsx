import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserPlus, FileText, Settings, LogOut, Activity, ClipboardList, AlertCircle } from 'lucide-react';

const Sidebar = ({ pendingCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity size={22} />
        <span>Preeclampsia CDSS</span>
      </div>

      <nav className="nav-links" style={{ flex: 1, overflowY: 'auto' }}>
        {/* === ADMIN: Administration first (at the top) === */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="sidebar-section-label">Administration</div>
            <NavLink to="/" className={navLinkClass} end>
              <LayoutDashboard size={16} /> Overview
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              <Settings size={16} /> User Management
            </NavLink>
            <NavLink to="/admin/report" className={navLinkClass}>
              <ClipboardList size={16} /> System Report
            </NavLink>
          </>
        )}

        {/* === NURSE + DOCTOR === */}
        {(user?.role === 'NURSE' || user?.role === 'DOCTOR') && (
          <>
            <div className="sidebar-section-label">Clinical</div>
            <NavLink to="/" className={navLinkClass} end>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink to="/patients" className={navLinkClass}>
              <Users size={16} /> Patients
            </NavLink>
            <NavLink to="/patients/new" className={navLinkClass}>
              <UserPlus size={16} /> Register Patient
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              <FileText size={16} /> Reports
            </NavLink>
          </>
        )}

        {/* === ADMIN: Clinical section (below Administration) === */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="sidebar-section-label">Clinical</div>
            <NavLink to="/patients" className={navLinkClass}>
              <Users size={16} /> Patients
            </NavLink>
            <NavLink to="/patients/new" className={navLinkClass}>
              <UserPlus size={16} /> Register Patient
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              <FileText size={16} /> Reports
            </NavLink>
          </>
        )}

        {/* === DOCTOR + ADMIN: Review Queue === */}
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
          <>
            <div className="sidebar-section-label">Review Queue</div>
            <NavLink to="/review-queue" className={navLinkClass}>
              <AlertCircle size={16} /> Pending Review
              {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-role-tag">
        <strong>{user?.name}</strong>
        <span className="text-muted">{user?.role}</span>
      </div>

      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'var(--muted)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
