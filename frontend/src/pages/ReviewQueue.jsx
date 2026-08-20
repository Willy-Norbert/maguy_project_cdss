import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, User } from 'lucide-react';

const RiskBadge = ({ score }) => {
  const category = score >= 60 ? 'HIGH' : score >= 40 ? 'MODERATE' : 'LOW';
  const styles = {
    HIGH:     { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
    MODERATE: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    LOW:      { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  };
  return (
    <span style={{ ...styles[category], padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
      {category}
    </span>
  );
};

const UrgencyBar = ({ score }) => {
  const pct = Math.min(score, 100);
  const color = score >= 60 ? '#b91c1c' : score >= 40 ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '28px', color }}>{score}</span>
    </div>
  );
};

const ReviewQueue = () => {
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/pending-queue');
      setQueue(data.queue || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending review queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 60 seconds to catch new escalations
    const interval = setInterval(fetchQueue, 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const filtered = filter === 'ALL'
    ? queue
    : queue.filter(a => (a.riskScore >= 60 ? 'HIGH' : a.riskScore >= 40 ? 'MODERATE' : 'LOW') === filter);

  const highCount = queue.filter(a => a.riskScore >= 60).length;
  const modCount  = queue.filter(a => a.riskScore >= 40 && a.riskScore < 60).length;

  const filterBtnStyle = (f) => ({
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: filter === f ? '2px solid var(--fg)' : '1.5px solid var(--border)',
    background: filter === f ? 'var(--fg)' : 'transparent',
    color: filter === f ? 'var(--bg)' : 'var(--fg)',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <AlertCircle style={{ color: 'var(--risk-high)' }} size={26} />
            Pending Review Queue
          </h1>
          <p>Moderate and High risk cases escalated by clinical staff requiring doctor review.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchQueue}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid cols-3 mb-6">
        <div className="stat-card stat-accent-black">
          <div className="stat-label">Total Pending</div>
          <div className="stat-value">{total}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>cases awaiting doctor review</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #b91c1c' }}>
          <div className="stat-label">High Risk (≥60)</div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>{highCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>requires immediate attention</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-label">Moderate Risk (40–59)</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{modCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>monitor closely</div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3>Cases Awaiting Review</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: `All (${total})`, val: 'ALL' },
              { label: `High (${highCount})`, val: 'HIGH' },
              { label: `Moderate (${modCount})`, val: 'MODERATE' },
            ].map(({ label, val }) => (
              <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
            <Clock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            Loading pending cases...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--risk-low)', margin: '0 auto 16px', display: 'block' }} />
            <h3 className="mb-2">
              {filter === 'ALL' ? 'No pending cases' : `No ${filter.toLowerCase()} risk cases pending`}
            </h3>
            <p className="text-muted">
              {filter === 'ALL'
                ? 'All escalated cases have been reviewed. Great work!'
                : `Switch to "All" to see all pending cases.`}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '28px' }}>#</th>
                  <th>Patient</th>
                  <th>Age / GA</th>
                  <th>Date Submitted</th>
                  <th>Assessed By</th>
                  <th>Risk Score</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
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
                    <td style={{ fontSize: '13px' }}>
                      <div>{a.patient.age}y old</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{a.patient.gestationalAge} wks gestation</div>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <div>{format(new Date(a.assessmentDate), 'MMM dd, yyyy')}</div>
                      <div className="text-muted">{format(new Date(a.assessmentDate), 'HH:mm')}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User size={13} style={{ color: 'var(--muted)' }} />
                        <span style={{ fontSize: '13px' }}>{a.assessedBy?.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ minWidth: '120px' }}>
                      <UrgencyBar score={a.riskScore} />
                    </td>
                    <td><RiskBadge score={a.riskScore} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/assessments/${a.id}/result`)}
                        style={{ fontSize: '12px', padding: '5px 14px' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
            Auto-refreshes every 60 seconds · Sorted by highest risk score first
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewQueue;
