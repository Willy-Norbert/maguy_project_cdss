import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, Info, Printer, ArrowLeft, Activity, User } from 'lucide-react';
import Badge from '../components/Badge';
import { format } from 'date-fns';

const AssessmentResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    clinicalOutcome: 'REFERRED_TO_SPECIALIST',
    doctorNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/reports/assessment/${id}`);
      setAssessment(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/reports/assessment/${id}/review`, reviewForm);
      await fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assessment) return <div className="page-container">Loading...</div>;

  const { riskCategory, riskScore, contributingFactors, recommendations, patient, status } = assessment;

  const getRiskIcon = () => {
    if (riskCategory === 'HIGH') return <AlertTriangle size={32} className="mb-2 text-danger" style={{ color: 'var(--risk-high)' }}/>;
    if (riskCategory === 'MODERATE') return <Info size={32} className="mb-2 text-warning" style={{ color: 'var(--risk-mod)' }}/>;
    return <CheckCircle2 size={32} className="mb-2 text-success" style={{ color: 'var(--risk-low)' }}/>;
  };

  const formatOutcome = (outcome) => {
    if (!outcome) return '';
    return outcome.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-6 no-print">
        <button className="btn btn-outline" onClick={() => navigate(`/patients/${patient.id}`)}>
          <ArrowLeft size={16} /> Back to Patient
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {status === 'PENDING_REVIEW' && user.role === 'NURSE' && (
        <div className="alert-banner alert-warning">
          <Activity size={18} />
          This case has been flagged and is currently pending review by a doctor.
        </div>
      )}

      {status === 'REVIEWED' && (
        <div className="alert-banner alert-info">
          <CheckCircle2 size={18} />
          This case was reviewed by {assessment.reviewedBy?.name} on {format(new Date(assessment.reviewedAt), 'MMM dd, HH:mm')}.
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-start border-b" style={{ paddingBottom: '1.5rem', borderColor: 'var(--border)' }}>
          <div>
            <h1 className="mb-2">Risk Analysis Report</h1>
            <div className="text-muted">
              <strong>Patient:</strong> {patient.name} ({patient.patientCode})<br/>
              <strong>Date:</strong> {format(new Date(assessment.assessmentDate), 'PPpp')}<br/>
              <strong>Assessed by:</strong> {assessment.assessedBy.name} ({assessment.assessedBy.role})
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted mb-1">Clinical Vitals</div>
            <div className="font-medium">BP: {assessment.systolicBP}/{assessment.diastolicBP} mmHg</div>
            <div className="font-medium">MAP: {assessment.map} mmHg</div>
            <div className="font-medium">Protein: {assessment.urineProtein === 0 ? 'Negative' : `${assessment.urineProtein - 1}+`}</div>
          </div>
        </div>

        <div className="result-hero border-b" style={{ borderColor: 'var(--border)' }}>
          {getRiskIcon()}
          <h2 className="mb-4">Risk Classification</h2>
          <div className={`score-ring ${riskCategory}`}>
            {riskScore}
            <span className="score-label">Score</span>
          </div>
          <Badge riskCategory={riskCategory} />
          <p className="text-muted mt-4 max-w-md mx-auto text-sm">
            Deterministic risk score based on clinical guidelines (max 100).
          </p>
        </div>

        <div className="grid cols-2 gap-8 mt-8 text-left">
          <div>
            <h3 className="flex items-center gap-2 mb-4"><AlertTriangle size={18} /> Contributing Factors</h3>
            {contributingFactors.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {contributingFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 mb-2">
                    <span style={{ color: 'var(--risk-high)', marginTop: '2px' }}>•</span> 
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted text-sm">No significant risk factors detected.</div>
            )}
          </div>
          <div>
            <h3 className="flex items-center gap-2 mb-4"><CheckCircle2 size={18} /> System Recommendations</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 mb-2">
                  <span style={{ color: 'var(--fg)', marginTop: '2px' }}>✓</span> 
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- DOCTOR REVIEW SECTION --- */}
        {status === 'PENDING_REVIEW' && (user.role === 'DOCTOR' || user.role === 'ADMIN') && (
          <form className="review-panel no-print" onSubmit={handleReviewSubmit}>
            <h3 className="flex items-center gap-2"><User size={18} /> Clinical Review Required</h3>
            <p className="text-sm text-muted mb-4">Please record your clinical decision to close this case.</p>
            
            <div className="input-group">
              <label>Clinical Outcome / Action Taken</label>
              <select 
                className="input" 
                value={reviewForm.clinicalOutcome}
                onChange={e => setReviewForm({...reviewForm, clinicalOutcome: e.target.value})}
              >
                <option value="REFERRED_TO_SPECIALIST">Referred to Specialist</option>
                <option value="ADMITTED">Patient Admitted</option>
                <option value="TREATMENT_STARTED">Treatment Started</option>
                <option value="FOLLOW_UP_SCHEDULED">Follow-up Scheduled</option>
                <option value="NO_ACTION_REQUIRED">No Action Required</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Doctor's Notes</label>
              <textarea 
                className="input" 
                rows="3" 
                placeholder="Enter clinical notes, prescriptions, or rationale..."
                value={reviewForm.doctorNotes}
                onChange={e => setReviewForm({...reviewForm, doctorNotes: e.target.value})}
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                Submit Clinical Review
              </button>
            </div>
          </form>
        )}

        {/* --- COMPLETED REVIEW DISPLAY --- */}
        {status === 'REVIEWED' && (
          <div className="review-panel" style={{ background: 'transparent' }}>
            <h3 className="flex items-center gap-2"><User size={18} /> Doctor's Clinical Review</h3>
            <div className="grid cols-2 gap-4 mt-4">
              <div>
                <span className="text-xs text-muted uppercase tracking-wider block mb-1">Clinical Outcome</span>
                <span className="font-medium">{formatOutcome(assessment.clinicalOutcome)}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-wider block mb-1">Reviewed By</span>
                <span className="font-medium">{assessment.reviewedBy?.name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted uppercase tracking-wider block mb-1">Clinical Notes</span>
                <p className="text-sm p-3 bg-surface rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {assessment.doctorNotes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentResult;
