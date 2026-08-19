import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ReviewQueue = () => {
  const [pending, setPending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setPending(res.data.pendingQueue || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <AlertCircle style={{ color: 'var(--risk-high)' }} /> Pending Review Queue
          </h1>
          <p>Moderate and High risk cases escalated by clinical staff requiring doctor review.</p>
        </div>
      </div>

      <div className="card">
        {pending.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={48} style={{ color: 'var(--risk-low)' }} />
            <h3 className="mt-4 mb-2">No pending reviews</h3>
            <p>All moderate and high-risk cases have been reviewed.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / Gest.</th>
                  <th>Assessment Date</th>
                  <th>Risk Level</th>
                  <th>Score</th>
                  <th>Assessed By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(a => (
                  <tr key={a.id} className="row-clickable" onClick={() => navigate(`/assessments/${a.id}/result`)}>
                    <td>
                      <div className="font-medium">{a.patient.name}</div>
                      <div className="text-xs text-muted">{a.patient.patientCode}</div>
                    </td>
                    <td>{a.patient.age}y / {a.patient.gestationalAge}w</td>
                    <td>{format(new Date(a.assessmentDate), 'MMM dd, HH:mm')}</td>
                    <td><Badge riskCategory={a.riskCategory} /></td>
                    <td className="font-bold">{a.riskScore}</td>
                    <td>{a.assessedBy.name}</td>
                    <td>
                      <button className="btn btn-primary btn-sm">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewQueue;
