import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const AssessmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    systolicBP: '',
    diastolicBP: '',
    urineProtein: '0',
    bloodGlucose: '',
    previousPreeclampsia: false,
    diabetes: false,
    chronicHypertension: false,
    kidneyDisease: false,
    familyHistory: false,
    labResults: ''
  });

  useEffect(() => {
    api.get(`/patients/${id}`).then(res => setPatient(res.data)).catch(console.error);
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        systolicBP: parseInt(formData.systolicBP),
        diastolicBP: parseInt(formData.diastolicBP),
        urineProtein: parseInt(formData.urineProtein),
        bloodGlucose: formData.bloodGlucose ? parseFloat(formData.bloodGlucose) : null,
      };
      const { data } = await api.post(`/patients/${id}/assessments`, payload);
      navigate(`/assessments/${data.id}/result`);
    } catch (err) {
      console.error(err);
      alert('Assessment failed');
    }
  };

  if (!patient) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="mb-6">
        <h1 className="mb-1">Clinical Assessment</h1>
        <div className="text-muted">Patient: {patient.name} ({patient.patientCode}) • Gestational Age: {patient.gestationalAge} wks</div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h3 className="mb-4">Vital Signs & Dipstick</h3>
        <div className="grid grid-cols-2 mb-6 border-b" style={{ paddingBottom: '1.5rem', borderColor: 'var(--border)' }}>
          <div className="input-group">
            <label>Systolic BP (mmHg)</label>
            <input type="number" name="systolicBP" className="input" value={formData.systolicBP} onChange={handleChange} required min="70" max="250" />
          </div>
          <div className="input-group">
            <label>Diastolic BP (mmHg)</label>
            <input type="number" name="diastolicBP" className="input" value={formData.diastolicBP} onChange={handleChange} required min="40" max="150" />
          </div>
          
          <div className="input-group">
            <label>Urine Protein (Dipstick)</label>
            <select name="urineProtein" className="input" value={formData.urineProtein} onChange={handleChange}>
              <option value="0">Negative</option>
              <option value="1">Trace</option>
              <option value="2">1+</option>
              <option value="3">2+</option>
              <option value="4">3+ or 4+</option>
            </select>
          </div>
          <div className="input-group">
            <label>Blood Glucose (mmol/L) - Optional</label>
            <input type="number" step="0.1" name="bloodGlucose" className="input" value={formData.bloodGlucose} onChange={handleChange} />
          </div>
        </div>

        <h3 className="mb-4">Risk Factors & History</h3>
        <div className="grid grid-cols-2 mb-6">
          <label className="checkbox-group">
            <input type="checkbox" name="previousPreeclampsia" checked={formData.previousPreeclampsia} onChange={handleChange} />
            <span>Previous Preeclampsia</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="chronicHypertension" checked={formData.chronicHypertension} onChange={handleChange} />
            <span>Chronic Hypertension</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="diabetes" checked={formData.diabetes} onChange={handleChange} />
            <span>Pre-existing Diabetes</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="kidneyDisease" checked={formData.kidneyDisease} onChange={handleChange} />
            <span>Chronic Kidney Disease</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="familyHistory" checked={formData.familyHistory} onChange={handleChange} />
            <span>Family History of Preeclampsia</span>
          </label>
        </div>

        <div className="input-group mt-4">
          <label>Additional Lab Results / Notes (Optional)</label>
          <textarea name="labResults" className="input" rows="2" value={formData.labResults} onChange={handleChange}></textarea>
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <button type="button" className="btn btn-outline" onClick={() => navigate(`/patients/${id}`)}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>Analyse Risk</button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
