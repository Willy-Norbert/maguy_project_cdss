import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import PatientDetail from './pages/PatientDetail';
import AssessmentForm from './pages/AssessmentForm';
import AssessmentResult from './pages/AssessmentResult';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import ReviewQueue from './pages/ReviewQueue';
import ReportGenerator from './pages/ReportGenerator';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="page-container">Loading session...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return <Layout>{children}</Layout>;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  return <Dashboard userRole={user?.role} />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    
    <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
    
    {/* Clinical Routes */}
    <Route path="/patients" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><Patients /></ProtectedRoute>} />
    <Route path="/patients/new" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><AddPatient /></ProtectedRoute>} />
    <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><PatientDetail /></ProtectedRoute>} />
    <Route path="/patients/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN']}><EditPatient /></ProtectedRoute>} />
    <Route path="/patients/:id/assess" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><AssessmentForm /></ProtectedRoute>} />
    <Route path="/assessments/:id/result" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><AssessmentResult /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}><Reports /></ProtectedRoute>} />
    
    {/* Doctor Only Routes */}
    <Route path="/review-queue" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><ReviewQueue /></ProtectedRoute>} />

    {/* Admin Only Routes */}
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/report" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportGenerator /></ProtectedRoute>} />
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
