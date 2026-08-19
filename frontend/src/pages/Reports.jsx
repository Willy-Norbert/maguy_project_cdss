import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import Badge from '../components/Badge';

const Reports = () => {
  const [highRisk, setHighRisk] = useState([]);

  useEffect(() => {
    api.get('/reports/high-risk').then(res => setHighRisk(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <h1>Reports</h1>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div className="card mb-8">
        <h3 className="mb-4">High-Risk Patients Registry</h3>
        <p className="text-sm text-muted mb-4">List of all assessments classified as HIGH risk requiring immediate clinical attention.</p>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Assessment Date</th>
                <th>Vitals (BP / Protein)</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {highRisk.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.patient.name}</div>
                    <div className="text-xs text-muted">{a.patient.patientCode}</div>
                  </td>
                  <td>{format(new Date(a.assessmentDate), 'MMM dd, yyyy HH:mm')}</td>
                  <td>{a.systolicBP}/{a.diastolicBP} | {a.urineProtein === 0 ? 'Neg' : `${a.urineProtein-1}+`}</td>
                  <td className="font-bold">{a.riskScore}</td>
                  <td><Badge riskCategory={a.riskCategory} /></td>
                </tr>
              ))}
              {highRisk.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted">No high-risk patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
