import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/patients/${id}`);
        setPatient(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatient();
  }, [id]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>{patient.name}</h1>
          <p className="text-muted">ID: {patient.patientCode} • Registered: {new Date(patient.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'ADMIN' && (
            <button className="btn btn-outline" onClick={() => navigate(`/patients/${patient.id}/edit`)}>Edit Patient</button>
          )}
          <button className="btn btn-primary" onClick={() => navigate(`/patients/${patient.id}/assess`)}>
            <Activity size={16} /> New Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 mb-8">
        <div className="card col-span-1">
          <h3 className="mb-4">Patient Profile</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div><span className="text-muted block">Age</span><span className="font-medium">{patient.age} yrs</span></div>
            <div><span className="text-muted block">Gestational Age</span><span className="font-medium">{patient.gestationalAge} wks</span></div>
            <div><span className="text-muted block">Weight</span><span className="font-medium">{patient.weight} kg</span></div>
            <div><span className="text-muted block">Height</span><span className="font-medium">{patient.height} cm</span></div>
            <div><span className="text-muted block">BMI</span><span className="font-medium">{patient.bmi}</span></div>
            <div><span className="text-muted block">Parity</span><span className="font-medium">{patient.previousPregnancies}</span></div>
            <div className="col-span-2"><span className="text-muted block">Contact</span><span className="font-medium">{patient.contact || 'N/A'}</span></div>
            <div className="col-span-2"><span className="text-muted block">Medical History</span><span className="font-medium">{patient.medicalHistory || 'None'}</span></div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-4">Assessment History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>BP</th>
                  <th>Protein</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {patient.assessments.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assessments/${a.id}/result`)}>
                    <td>{format(new Date(a.assessmentDate), 'MMM dd, yyyy HH:mm')}</td>
                    <td>{a.systolicBP}/{a.diastolicBP}</td>
                    <td>
                      {a.urineProtein === 0 ? 'Neg' : a.urineProtein === 1 ? 'Trace' : `${a.urineProtein - 1}+`}
                    </td>
                    <td className="font-bold">{a.riskScore}</td>
                    <td><Badge riskCategory={a.riskCategory} /></td>
                    <td>{a.assessedBy.name}</td>
                  </tr>
                ))}
                {patient.assessments.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted">No assessments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
