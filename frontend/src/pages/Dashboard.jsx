import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { format } from 'date-fns';
import { Activity, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Sparkline = ({ data, dataKey, color }) => (
  <div style={{ width: '100%', height: 40, marginTop: '10px' }}>
    <ResponsiveContainer>
      <BarChart data={data}>
        <Tooltip cursor={false} contentStyle={{ display: 'none' }} />
        <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const StatCard = ({ title, value, colorClass, colorCode, sparklineData, sparklineKey }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-label">{title}</div>
    <div className="stat-value" style={{ color: colorClass === 'stat-accent-high' ? 'var(--risk-high)' : 'inherit' }}>{value}</div>
    {sparklineData && sparklineData.length > 0 && (
      <Sparkline data={sparklineData} dataKey={sparklineKey} color={colorCode} />
    )}
  </div>
);

const Dashboard = ({ userRole }) => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="page-container">Loading...</div>;

  const riskDistribution = [
    { name: 'High Risk', value: data.stats.HIGH, color: 'var(--risk-high)' },
    { name: 'Moderate Risk', value: data.stats.MODERATE, color: 'var(--risk-mod)' },
    { name: 'Low Risk', value: data.stats.LOW, color: 'var(--risk-low)' }
  ];

  const renderStatCards = () => {
    if (userRole === 'ADMIN') {
      return (
        <div className="grid cols-4 mb-6">
          <StatCard title="Total Patients" value={data.stats.totalPatients} colorClass="stat-accent-black" colorCode="var(--fg)" />
          <StatCard title="Total Assessments" value={data.stats.totalAssessments} colorClass="stat-accent-black" colorCode="var(--fg)" sparklineData={data.sparklines} sparklineKey="total" />
          <StatCard title="High Risk Cases" value={data.stats.HIGH} colorClass="stat-accent-high" colorCode="var(--risk-high)" sparklineData={data.sparklines} sparklineKey="HIGH" />
          <StatCard title="Moderate Risk" value={data.stats.MODERATE} colorClass="stat-accent-mod" colorCode="var(--risk-mod)" sparklineData={data.sparklines} sparklineKey="MODERATE" />
        </div>
      );
    }
    if (userRole === 'NURSE') {
      return (
        <div className="grid cols-4 mb-6">
          <StatCard title="Total Patients" value={data.stats.totalPatients} colorClass="stat-accent-black" colorCode="var(--fg)" />
          <StatCard title="My Assessments" value={data.stats.myAssessments} colorClass="stat-accent-black" colorCode="var(--fg)" sparklineData={data.sparklines} sparklineKey="total" />
          <StatCard title="High Risk Found" value={data.stats.HIGH} colorClass="stat-accent-high" colorCode="var(--risk-high)" sparklineData={data.sparklines} sparklineKey="HIGH" />
          <StatCard title="Moderate Risk Found" value={data.stats.MODERATE} colorClass="stat-accent-mod" colorCode="var(--risk-mod)" sparklineData={data.sparklines} sparklineKey="MODERATE" />
        </div>
      );
    }
    if (userRole === 'DOCTOR') {
      return (
        <div className="grid cols-4 mb-6">
          <StatCard title="Pending Review" value={data.stats.pendingReview} colorClass="stat-accent-high" colorCode="var(--risk-high)" />
          <StatCard title="Reviewed Today" value={data.stats.reviewedToday} colorClass="stat-accent-black" colorCode="var(--fg)" />
          <StatCard title="Total Patients" value={data.stats.totalPatients} colorClass="stat-accent-black" colorCode="var(--fg)" />
          <StatCard title="Moderate Risk (All)" value={data.stats.MODERATE} colorClass="stat-accent-mod" colorCode="var(--risk-mod)" sparklineData={data.sparklines} sparklineKey="MODERATE" />
        </div>
      );
    }
  };

  const renderCharts = () => (
    <div className="grid cols-3 gap-6 mb-8">
      <div className="card col-span-2">
        <h3 className="mb-4">Risk Assessments Overview (Last 30 Days)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              <Area type="monotone" dataKey="HIGH" name="High Risk" stackId="1" stroke="var(--risk-high)" fill="var(--risk-high)" />
              <Area type="monotone" dataKey="MODERATE" name="Moderate Risk" stackId="1" stroke="var(--risk-mod)" fill="var(--risk-mod)" />
              <Area type="monotone" dataKey="LOW" name="Low Risk" stackId="1" stroke="var(--risk-low)" fill="var(--risk-low)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card">
        <h3 className="mb-4">Risk Severity Breakdown</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="var(--bg)"
                strokeWidth={2}
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{userRole === 'ADMIN' ? 'System Overview' : 'Dashboard'}</h1>
          <p>Welcome back! Here is a summary of your clinical data.</p>
        </div>
      </div>

      {renderStatCards()}
      
      {renderCharts()}

      {/* --- DOCTOR Specific Tables --- */}
      {userRole === 'DOCTOR' && (
        <div className="grid cols-2 gap-8">
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-danger">
              <AlertCircle size={18} style={{ color: 'var(--risk-high)' }} /> Action Required
            </h3>
            {data.pendingQueue?.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Risk</th>
                      <th>Assessed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pendingQueue.slice(0, 5).map(a => (
                      <tr key={a.id} className="row-clickable" onClick={() => navigate(`/assessments/${a.id}/result`)}>
                        <td><div className="font-medium">{a.patient.name}</div><div className="text-xs text-muted">{a.patient.patientCode}</div></td>
                        <td><Badge riskCategory={a.riskCategory} /></td>
                        <td className="text-sm">{a.assessedBy.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <UserCheck size={32} />
                <p>All caught up! No pending cases.</p>
              </div>
            )}
            {data.pendingQueue?.length > 5 && (
              <button className="btn btn-outline mt-4" style={{ width: '100%' }} onClick={() => navigate('/review-queue')}>
                View all {data.pendingQueue.length} pending cases
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4 flex items-center gap-2"><Clock size={18} /> Recent Activity</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAssessments?.slice(0, 5).map(a => (
                    <tr key={a.id} className="row-clickable" onClick={() => navigate(`/assessments/${a.id}/result`)}>
                      <td>{format(new Date(a.assessmentDate), 'MMM dd')}</td>
                      <td>{a.patient.name}</td>
                      <td className="font-bold">{a.riskScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- NURSE Specific Tables --- */}
      {userRole === 'NURSE' && (
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2"><Activity size={18} /> My Recent Assessments</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments?.map(a => (
                  <tr key={a.id} className="row-clickable" onClick={() => navigate(`/assessments/${a.id}/result`)}>
                    <td><div className="font-medium">{a.patient.name}</div><div className="text-xs text-muted">{a.patient.patientCode}</div></td>
                    <td>{format(new Date(a.assessmentDate), 'MMM dd, HH:mm')}</td>
                    <td className="font-bold">{a.riskScore}</td>
                    <td><Badge riskCategory={a.riskCategory} /></td>
                    <td>
                      {a.status === 'ROUTINE' && <span className="badge badge-neutral">Routine</span>}
                      {a.status === 'PENDING_REVIEW' && <span className="badge badge-moderate">Pending Doctor</span>}
                      {a.status === 'REVIEWED' && <span className="badge badge-success">Reviewed</span>}
                    </td>
                  </tr>
                ))}
                {(!data.recentAssessments || data.recentAssessments.length === 0) && (
                  <tr><td colSpan="5" className="empty-state">No recent assessments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
