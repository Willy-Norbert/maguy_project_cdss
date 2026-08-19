import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gestationalAge: '',
    weight: '',
    height: '',
    contact: '',
    medicalHistory: '',
    previousPregnancies: 0
  });

  const bmi = formData.weight && formData.height 
    ? (Number(formData.weight) / Math.pow(Number(formData.height) / 100, 2)).toFixed(2)
    : '--';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        gestationalAge: parseInt(formData.gestationalAge),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        previousPregnancies: parseInt(formData.previousPregnancies)
      };
      const { data } = await api.post('/patients', payload);
      navigate(`/patients/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to add patient');
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className="mb-6">Add New Patient</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2">
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Age (years)</label>
            <input type="number" name="age" className="input" value={formData.age} onChange={handleChange} required min="10" max="60" />
          </div>
          
          <div className="input-group">
            <label>Gestational Age (weeks)</label>
            <input type="number" name="gestationalAge" className="input" value={formData.gestationalAge} onChange={handleChange} required min="1" max="42" />
          </div>
          <div className="input-group">
            <label>Contact Number</label>
            <input type="text" name="contact" className="input" value={formData.contact} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.1" name="weight" className="input" value={formData.weight} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Height (cm)</label>
            <input type="number" step="0.1" name="height" className="input" value={formData.height} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Auto-calculated BMI</label>
            <input type="text" className="input" value={bmi} disabled style={{ backgroundColor: 'var(--surface)' }} />
          </div>
          <div className="input-group">
            <label>Previous Pregnancies (Parity)</label>
            <input type="number" name="previousPregnancies" className="input" value={formData.previousPregnancies} onChange={handleChange} required min="0" />
          </div>
        </div>

        <div className="input-group mt-4">
          <label>Medical History & Notes</label>
          <textarea 
            name="medicalHistory" 
            className="input" 
            rows="3" 
            value={formData.medicalHistory} 
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/patients')}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Patient</button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;
