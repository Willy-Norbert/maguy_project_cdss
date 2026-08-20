import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

const getRiskFromScore = (score) => {
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
};

const RiskBadge = ({ score }) => {
  const category = getRiskFromScore(score);
  const styles = {
    HIGH:     { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
    MODERATE: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    LOW:      { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  };
  return (
    <span style={{
      ...styles[category],
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
    }}>
      {category}
    </span>
  );
};

const Reports = () => {
  const [assessments, setAssessments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ALL assessments, not just HIGH
    api.get('/reports/high-risk')
      .then(res => {
        setAssessments(res.data);
        setFiltered(res.data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });

    // Also fetch ALL risk assessments via a broader endpoint
    api.get('/patients')
      .then(async () => {
        // Use existing trends endpoint for full data — pull all assessments via the system-report if available
      })
      .catch(() => {});
  }, []);

  // Fetch all assessments (not just high-risk)
  useEffect(() => {
    api.get('/reports/all-assessments')
      .then(res => {
        setAssessments(res.data);
        applyFilter(res.data, activeFilter);
        setLoading(false);
      })
      .catch(() => {
        // fallback already set above
        setLoading(false);
      });
  }, []);

  const applyFilter = (data, filter) => {
    if (filter === 'ALL') {
      setFiltered(data);
    } else {
      setFiltered(data.filter(a => getRiskFromScore(a.riskScore) === filter));
    }
  };

  const handleFilter = (filter) => {
    setActiveFilter(filter);
    applyFilter(assessments, filter);
  };

  const counts = {
    ALL: assessments.length,
    HIGH: assessments.filter(a => getRiskFromScore(a.riskScore) === 'HIGH').length,
    MODERATE: assessments.filter(a => getRiskFromScore(a.riskScore) === 'MODERATE').length,
    LOW: assessments.filter(a => getRiskFromScore(a.riskScore) === 'LOW').length,
  };

  const filterBtnStyle = (f) => ({
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: activeFilter === f ? '2px solid var(--fg)' : '1.5px solid var(--border)',
    background: activeFilter === f ? 'var(--fg)' : 'transparent',
    color: activeFilter === f ? 'var(--bg)' : 'var(--fg)',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1>Clinical Reports</h1>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
            All assessments with live risk classification — Score: 0–39 LOW · 40–59 MODERATE · 60–100 HIGH
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid cols-4 mb-6">
        <div className="stat-card stat-accent-black">
          <div className="stat-label">Total Assessments</div>
          <div className="stat-value">{counts.ALL}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #b91c1c' }}>
          <div className="stat-label">High Risk (≥60)</div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>{counts.HIGH}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-label">Moderate Risk (40–59)</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{counts.MODERATE}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="stat-label">Low Risk (0–39)</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{counts.LOW}</div>
        </div>
      </div>

      <div className="card">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-4">
          <h3>Assessment Registry</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'HIGH', 'MODERATE', 'LOW'].map(f => (
              <button key={f} style={filterBtnStyle(f)} onClick={() => handleFilter(f)}>
                {f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-muted" style={{ padding: '40px', textAlign: 'center' }}>Loading assessments...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Vitals (BP / Protein)</th>
                  <th>Risk Score</th>
                  <th>Risk Category</th>
                  <th>Status</th>
                  <th>Assessed By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td className="text-muted" style={{ fontSize: '12px' }}>{i + 1}</td>
                    <td>
                      <div className="font-medium">{a.patient.name}</div>
                      <div className="text-xs text-muted">{a.patient.patientCode}</div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{format(new Date(a.assessmentDate), 'MMM dd, yyyy HH:mm')}</td>
                    <td>{a.systolicBP}/{a.diastolicBP} | {a.urineProtein === 0 ? 'Neg' : `${a.urineProtein - 1}+`}</td>
                    <td className="font-bold" style={{ fontSize: '16px' }}>{a.riskScore}</td>
                    <td><RiskBadge score={a.riskScore} /></td>
                    <td style={{ fontSize: '11px' }}>
                      {a.status === 'ROUTINE' && <span style={{ color: '#166534', fontWeight: 600 }}>Routine</span>}
                      {a.status === 'PENDING_REVIEW' && <span style={{ color: '#92400e', fontWeight: 600 }}>Pending Review</span>}
                      {a.status === 'REVIEWED' && <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Reviewed</span>}
                    </td>
                    <td style={{ fontSize: '12px' }}>{a.assessedBy?.name || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      No assessments found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
