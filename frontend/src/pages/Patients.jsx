import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients(search);
  }, [search]);

  const fetchPatients = async (query = '') => {
    try {
      const { data } = await api.get(`/patients?search=${query}`);
      setPatients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete patient ${name}? This will also delete all their assessments.`)) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients(search);
      } catch (err) {
        alert('Failed to delete patient');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>Patients</h1>
        <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
          <Plus size={16} /> Add Patient
        </button>
      </div>

      <div className="card">
        <div className="mb-4" style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Search by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gest. Age</th>
                <th>Risk Profile</th>
                {user?.role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="row-clickable" onClick={() => navigate(`/patients/${p.id}`)}>
                  <td className="text-muted">{p.patientCode}</td>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gestationalAge} weeks</td>
                  <td>
                    {p.assessments && p.assessments.length > 0 ? (
                      <span className="badge">{p.assessments[0].riskCategory}</span>
                    ) : (
                      <span className="text-muted text-xs">No assessments</span>
                    )}
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-outline mr-2" onClick={() => navigate(`/patients/${p.id}/edit`)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;
