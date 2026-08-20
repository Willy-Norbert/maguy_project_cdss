import React, { useState } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ── Official Brand Icons (SVG inline) ──────────────────────────────────────
const PdfIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="6" fill="#E53935"/>
    <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">PDF</text>
  </svg>
);

const ExcelIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="6" fill="#1D6F42"/>
    <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">XLS</text>
  </svg>
);

const WordIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="6" fill="#2B579A"/>
    <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">DOC</text>
  </svg>
);

const CsvIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="6" fill="#374151"/>
    <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">CSV</text>
  </svg>
);

// ── Risk label helper ───────────────────────────────────────────────────────
const riskLabel = (score) => {
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
};

// ── CSV Export ──────────────────────────────────────────────────────────────
const exportCSV = (data) => {
  const rows = [
    ['PREECLAMPSIA CDSS — SYSTEM REPORT'],
    [`Generated: ${format(new Date(data.generatedAt), 'dd/MM/yyyy HH:mm')}`],
    [],
    ['=== SUMMARY ==='],
    ['Total Patients', data.summary.totalPatients],
    ['Total Assessments', data.summary.totalAssessments],
    ['Total System Users', data.summary.totalUsers],
    ['Active Users', data.summary.activeUsers],
    [],
    ['Risk Category', 'Count'],
    ['HIGH (score ≥ 60)', data.summary.riskSummary.HIGH],
    ['MODERATE (score 40–59)', data.summary.riskSummary.MODERATE],
    ['LOW (score < 40)', data.summary.riskSummary.LOW],
    [],
    ['Status', 'Count'],
    ['Routine', data.summary.statusSummary.ROUTINE],
    ['Pending Doctor Review', data.summary.statusSummary.PENDING_REVIEW],
    ['Reviewed', data.summary.statusSummary.REVIEWED],
    [],
    ['=== RECENT ASSESSMENTS ==='],
    ['Patient Name', 'Patient Code', 'Gestational Age (wks)', 'Systolic BP', 'Diastolic BP', 'Risk Score', 'Risk Category', 'Status', 'Assessed By', 'Reviewed By', 'Date'],
    ...data.recentAssessments.map(a => [
      a.patient.name, a.patient.patientCode, a.patient.gestationalAge,
      a.systolicBP, a.diastolicBP, a.riskScore, a.riskCategory, a.status,
      a.assessedBy?.name || '-', a.reviewedBy?.name || 'Pending',
      format(new Date(a.assessmentDate), 'dd/MM/yyyy HH:mm')
    ]),
    [],
    ['=== PATIENT REGISTRY ==='],
    ['Patient Code', 'Name', 'Age', 'Gestational Age (wks)', 'Last Risk Score', 'Last Risk Category', 'Last Assessment Date'],
    ...data.patients.map(p => {
      const last = p.assessments[0];
      return [
        p.patientCode, p.name, p.age, p.gestationalAge,
        last?.riskScore ?? '-', last?.riskCategory ?? 'None',
        last ? format(new Date(last.assessmentDate), 'dd/MM/yyyy') : 'No assessment'
      ];
    }),
    [],
    ['=== SYSTEM USERS ==='],
    ['Name', 'Username', 'Role', 'Status', 'Registered Date'],
    ...data.users.map(u => [
      u.name, u.username, u.role, u.isActive ? 'Active' : 'Deactivated',
      format(new Date(u.createdAt), 'dd/MM/yyyy')
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'System Report');
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `CDSS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
};

// ── Excel Export ────────────────────────────────────────────────────────────
const exportExcel = (data) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['PREECLAMPSIA CDSS — SYSTEM REPORT'],
    [`Generated: ${format(new Date(data.generatedAt), 'dd/MM/yyyy HH:mm')}`],
    [],
    ['SUMMARY STATISTICS'],
    ['Metric', 'Value'],
    ['Total Patients Registered', data.summary.totalPatients],
    ['Total Assessments Conducted', data.summary.totalAssessments],
    ['Total System Users', data.summary.totalUsers],
    ['Active Users', data.summary.activeUsers],
    [],
    ['RISK DISTRIBUTION'],
    ['Risk Level', 'Score Range', 'Total Cases'],
    ['HIGH', '60 – 100', data.summary.riskSummary.HIGH],
    ['MODERATE', '40 – 59', data.summary.riskSummary.MODERATE],
    ['LOW', '0 – 39', data.summary.riskSummary.LOW],
    [],
    ['ASSESSMENT STATUS'],
    ['Status', 'Count'],
    ['Routine (Low Risk)', data.summary.statusSummary.ROUTINE],
    ['Pending Doctor Review', data.summary.statusSummary.PENDING_REVIEW],
    ['Reviewed by Doctor', data.summary.statusSummary.REVIEWED],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Sheet 2: Assessments
  const assessRows = [
    ['Patient Name', 'Code', 'GA (wks)', 'Systolic BP', 'Diastolic BP', 'Risk Score', 'Category', 'Status', 'Assessed By', 'Reviewed By', 'Date'],
    ...data.recentAssessments.map(a => [
      a.patient.name, a.patient.patientCode, a.patient.gestationalAge,
      a.systolicBP, a.diastolicBP, a.riskScore, a.riskCategory, a.status,
      a.assessedBy?.name || '-', a.reviewedBy?.name || 'Pending',
      format(new Date(a.assessmentDate), 'dd/MM/yyyy HH:mm')
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assessRows), 'Assessments');

  // Sheet 3: Patients
  const patientRows = [
    ['Patient Code', 'Name', 'Age', 'GA (wks)', 'Last Score', 'Last Category', 'Last Assessment'],
    ...data.patients.map(p => {
      const last = p.assessments[0];
      return [p.patientCode, p.name, p.age, p.gestationalAge,
        last?.riskScore ?? '-', last?.riskCategory ?? 'None',
        last ? format(new Date(last.assessmentDate), 'dd/MM/yyyy') : 'No assessment'];
    })
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(patientRows), 'Patients');

  // Sheet 4: Users
  const userRows = [
    ['Name', 'Username', 'Role', 'Status', 'Registered'],
    ...data.users.map(u => [u.name, u.username, u.role, u.isActive ? 'Active' : 'Deactivated', format(new Date(u.createdAt), 'dd/MM/yyyy')])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(userRows), 'Users');

  XLSX.writeFile(wb, `CDSS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

// ── Word/HTML Export ────────────────────────────────────────────────────────
const exportWord = (data) => {
  const dt = format(new Date(data.generatedAt), 'dd MMMM yyyy, HH:mm');
  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>CDSS System Report</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #111; }
  h1 { font-size: 22px; border-bottom: 3px solid #111; padding-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; background: #111; color: #fff; padding: 6px 10px; }
  h3 { font-size: 14px; margin-top: 16px; }
  .meta { font-size: 12px; color: #555; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11px; }
  th { background: #111; color: #fff; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .pill { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
  .high { background: #fee2e2; color: #b91c1c; }
  .mod  { background: #fef3c7; color: #92400e; }
  .low  { background: #dcfce7; color: #166534; }
</style></head><body>
<h1>Preeclampsia CDSS — System Report</h1>
<p class="meta">Generated: ${dt} &nbsp;|&nbsp; System: Preeclampsia Clinical Decision Support System</p>

<h2>1. Summary Statistics</h2>
<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td>Total Patients Registered</td><td>${data.summary.totalPatients}</td></tr>
  <tr><td>Total Assessments Conducted</td><td>${data.summary.totalAssessments}</td></tr>
  <tr><td>Total System Users</td><td>${data.summary.totalUsers}</td></tr>
  <tr><td>Active Users</td><td>${data.summary.activeUsers}</td></tr>
</table>

<h2>2. Risk Distribution (Score-Based)</h2>
<table>
  <tr><th>Risk Level</th><th>Score Range</th><th>Total Cases</th></tr>
  <tr><td>HIGH</td><td>60 – 100</td><td>${data.summary.riskSummary.HIGH}</td></tr>
  <tr><td>MODERATE</td><td>40 – 59</td><td>${data.summary.riskSummary.MODERATE}</td></tr>
  <tr><td>LOW</td><td>0 – 39</td><td>${data.summary.riskSummary.LOW}</td></tr>
</table>

<h2>3. Assessment Workflow Status</h2>
<table>
  <tr><th>Status</th><th>Count</th></tr>
  <tr><td>Routine (Low Risk, auto-closed)</td><td>${data.summary.statusSummary.ROUTINE}</td></tr>
  <tr><td>Pending Doctor Review</td><td>${data.summary.statusSummary.PENDING_REVIEW}</td></tr>
  <tr><td>Reviewed by Doctor</td><td>${data.summary.statusSummary.REVIEWED}</td></tr>
</table>

<h2>4. Recent Assessments (Last 50)</h2>
<table>
  <tr><th>#</th><th>Patient</th><th>Code</th><th>GA (wks)</th><th>BP</th><th>Score</th><th>Category</th><th>Status</th><th>Assessed By</th><th>Reviewed By</th><th>Date</th></tr>
  ${data.recentAssessments.map((a, i) => `
  <tr>
    <td>${i + 1}</td>
    <td>${a.patient.name}</td>
    <td>${a.patient.patientCode}</td>
    <td>${a.patient.gestationalAge}</td>
    <td>${a.systolicBP}/${a.diastolicBP}</td>
    <td>${a.riskScore}</td>
    <td class="pill ${a.riskCategory === 'HIGH' ? 'high' : a.riskCategory === 'MODERATE' ? 'mod' : 'low'}">${a.riskCategory}</td>
    <td>${a.status}</td>
    <td>${a.assessedBy?.name || '-'}</td>
    <td>${a.reviewedBy?.name || 'Pending'}</td>
    <td>${format(new Date(a.assessmentDate), 'dd/MM/yyyy')}</td>
  </tr>`).join('')}
</table>

<h2>5. Patient Registry</h2>
<table>
  <tr><th>#</th><th>Code</th><th>Name</th><th>Age</th><th>GA (wks)</th><th>Last Score</th><th>Last Category</th><th>Last Assessment</th></tr>
  ${data.patients.map((p, i) => {
    const last = p.assessments[0];
    return `<tr>
      <td>${i + 1}</td><td>${p.patientCode}</td><td>${p.name}</td><td>${p.age}</td><td>${p.gestationalAge}</td>
      <td>${last?.riskScore ?? '-'}</td><td>${last?.riskCategory ?? 'None'}</td>
      <td>${last ? format(new Date(last.assessmentDate), 'dd/MM/yyyy') : 'No assessment'}</td>
    </tr>`;
  }).join('')}
</table>

<h2>6. System Users</h2>
<table>
  <tr><th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Registered</th></tr>
  ${data.users.map((u, i) => `
  <tr>
    <td>${i + 1}</td><td>${u.name}</td><td>${u.username}</td><td>${u.role}</td>
    <td>${u.isActive ? 'Active' : 'Deactivated'}</td>
    <td>${format(new Date(u.createdAt), 'dd/MM/yyyy')}</td>
  </tr>`).join('')}
</table>

</body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  saveAs(blob, `CDSS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.doc`);
};

// ── PDF Export ──────────────────────────────────────────────────────────────
const exportPDF = (data) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const dt = format(new Date(data.generatedAt), 'dd MMMM yyyy, HH:mm');

  // Header bar
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Preeclampsia CDSS — System Report', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${dt}`, 200, 14);

  let y = 32;

  // Summary boxes
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Summary Statistics', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Patients Registered', data.summary.totalPatients],
      ['Total Assessments Conducted', data.summary.totalAssessments],
      ['Total System Users', data.summary.totalUsers],
      ['Active Users', data.summary.activeUsers],
    ],
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 } },
    margin: { left: 14 },
    tableWidth: 130,
  });

  y = doc.lastAutoTable.finalY + 8;

  // Risk + Status side by side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Risk Distribution', 14, y);
  doc.text('3. Assessment Status', 150, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Risk Level', 'Score Range', 'Cases']],
    body: [
      ['HIGH', '60 – 100', data.summary.riskSummary.HIGH],
      ['MODERATE', '40 – 59', data.summary.riskSummary.MODERATE],
      ['LOW', '0 – 39', data.summary.riskSummary.LOW],
    ],
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14 },
    tableWidth: 120,
  });

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count']],
    body: [
      ['Routine', data.summary.statusSummary.ROUTINE],
      ['Pending Review', data.summary.statusSummary.PENDING_REVIEW],
      ['Reviewed', data.summary.statusSummary.REVIEWED],
    ],
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 150 },
    tableWidth: 100,
  });

  y = Math.max(doc.lastAutoTable.finalY, y + 40) + 8;

  // Recent Assessments
  if (y > 170) { doc.addPage(); y = 14; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. Recent Assessments', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Patient', 'Code', 'GA(wks)', 'BP', 'Score', 'Category', 'Status', 'Assessed By', 'Date']],
    body: data.recentAssessments.map((a, i) => [
      i + 1, a.patient.name, a.patient.patientCode, a.patient.gestationalAge,
      `${a.systolicBP}/${a.diastolicBP}`, a.riskScore, a.riskCategory, a.status,
      a.assessedBy?.name || '-',
      format(new Date(a.assessmentDate), 'dd/MM/yy')
    ]),
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 6) {
        const val = hookData.cell.raw;
        if (val === 'HIGH') hookData.cell.styles.textColor = [185, 28, 28];
        else if (val === 'MODERATE') hookData.cell.styles.textColor = [146, 64, 14];
        else hookData.cell.styles.textColor = [22, 101, 52];
      }
    }
  });

  // Patient Registry
  doc.addPage();
  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('5. Patient Registry', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Code', 'Name', 'Age', 'GA(wks)', 'Last Score', 'Last Category', 'Last Assessment']],
    body: data.patients.map((p, i) => {
      const last = p.assessments[0];
      return [i + 1, p.patientCode, p.name, p.age, p.gestationalAge,
        last?.riskScore ?? '-', last?.riskCategory ?? 'None',
        last ? format(new Date(last.assessmentDate), 'dd/MM/yyyy') : 'No assessment'];
    }),
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
  });

  // Users
  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('6. System Users', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Name', 'Username', 'Role', 'Status', 'Registered']],
    body: data.users.map((u, i) => [
      i + 1, u.name, u.username, u.role,
      u.isActive ? 'Active' : 'Deactivated',
      format(new Date(u.createdAt), 'dd/MM/yyyy')
    ]),
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} — Preeclampsia CDSS Confidential Report`, 14, 205);
  }

  doc.save(`CDSS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

// ── Main Component ──────────────────────────────────────────────────────────
const ReportGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reports/system-report');
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch report data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    if (!reportData) return;
    if (type === 'pdf') exportPDF(reportData);
    if (type === 'excel') exportExcel(reportData);
    if (type === 'word') exportWord(reportData);
    if (type === 'csv') exportCSV(reportData);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Report</h1>
          <p>Generate and export a comprehensive report of all system activity.</p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="card mb-6">
        <h3 className="mb-2">Generate Report</h3>
        <p className="text-muted mb-4" style={{ fontSize: '13px' }}>
          Pulls live data from the database including all patients, assessments, risk distribution, workflow status, and system users.
        </p>
        <button
          className="btn btn-primary"
          onClick={fetchReport}
          disabled={loading}
          style={{ minWidth: '180px' }}
        >
          {loading ? 'Loading data...' : reportData ? 'Refresh Report' : 'Generate Report'}
        </button>
        {error && <p style={{ color: 'var(--risk-high)', marginTop: '10px', fontSize: '13px' }}>{error}</p>}
      </div>

      {/* Export Options */}
      {reportData && (
        <>
          <div className="card mb-6">
            <h3 className="mb-4">Export As</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { type: 'pdf', label: 'PDF Document', Icon: PdfIcon, desc: 'Professional formatted report' },
                { type: 'excel', label: 'Excel Workbook', Icon: ExcelIcon, desc: '4 sheets: Summary, Assessments, Patients, Users' },
                { type: 'word', label: 'Word Document', Icon: WordIcon, desc: 'Editable .doc report' },
                { type: 'csv', label: 'CSV File', Icon: CsvIcon, desc: 'Raw data for analysis' },
              ].map(({ type, label, Icon, desc }) => (
                <button
                  key={type}
                  onClick={() => handleExport(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    background: 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    minWidth: '220px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--fg)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Icon />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--fg)' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="grid cols-4 mb-6">
            <div className="stat-card stat-accent-black">
              <div className="stat-label">Total Patients</div>
              <div className="stat-value">{reportData.summary.totalPatients}</div>
            </div>
            <div className="stat-card stat-accent-black">
              <div className="stat-label">Total Assessments</div>
              <div className="stat-value">{reportData.summary.totalAssessments}</div>
            </div>
            <div className="stat-card stat-accent-high">
              <div className="stat-label">High Risk (≥60)</div>
              <div className="stat-value" style={{ color: 'var(--risk-high)' }}>{reportData.summary.riskSummary.HIGH}</div>
            </div>
            <div className="stat-card stat-accent-mod">
              <div className="stat-label">Moderate Risk (40–59)</div>
              <div className="stat-value">{reportData.summary.riskSummary.MODERATE}</div>
            </div>
          </div>

          <div className="grid cols-2 gap-6 mb-6">
            {/* Status Summary */}
            <div className="card">
              <h3 className="mb-4">Workflow Status</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '2px solid var(--border)' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', borderBottom: '2px solid var(--border)' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Routine (Low Risk, auto-closed)</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{reportData.summary.statusSummary.ROUTINE}</td></tr>
                  <tr><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', color: 'var(--risk-mod)' }}>Pending Doctor Review</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--risk-mod)' }}>{reportData.summary.statusSummary.PENDING_REVIEW}</td></tr>
                  <tr><td style={{ padding: '8px 0' }}>Reviewed by Doctor</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{reportData.summary.statusSummary.REVIEWED}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Risk Summary */}
            <div className="card">
              <h3 className="mb-4">Risk Score Breakdown</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '2px solid var(--border)' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '2px solid var(--border)' }}>Score Range</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', borderBottom: '2px solid var(--border)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', color: 'var(--risk-high)', fontWeight: 600 }}>HIGH</td><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>60 – 100</td><td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--risk-high)' }}>{reportData.summary.riskSummary.HIGH}</td></tr>
                  <tr><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', color: 'var(--risk-mod)', fontWeight: 600 }}>MODERATE</td><td style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>40 – 59</td><td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--risk-mod)' }}>{reportData.summary.riskSummary.MODERATE}</td></tr>
                  <tr><td style={{ padding: '8px 0', color: 'var(--risk-low)', fontWeight: 600 }}>LOW</td><td style={{ padding: '8px 0', color: 'var(--muted)' }}>0 – 39</td><td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--risk-low)' }}>{reportData.summary.riskSummary.LOW}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Assessment Preview Table */}
          <div className="card">
            <h3 className="mb-4">Recent Assessments Preview (showing first 10)</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Code</th>
                    <th>GA (wks)</th>
                    <th>BP</th>
                    <th>Score</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Assessed By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.recentAssessments.slice(0, 10).map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td className="font-medium">{a.patient.name}</td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>{a.patient.patientCode}</td>
                      <td>{a.patient.gestationalAge}</td>
                      <td>{a.systolicBP}/{a.diastolicBP}</td>
                      <td className="font-bold">{a.riskScore}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          background: a.riskCategory === 'HIGH' ? '#fee2e2' : a.riskCategory === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                          color: a.riskCategory === 'HIGH' ? '#b91c1c' : a.riskCategory === 'MODERATE' ? '#92400e' : '#166534'
                        }}>{a.riskCategory}</span>
                      </td>
                      <td style={{ fontSize: '11px' }}>{a.status.replace('_', ' ')}</td>
                      <td style={{ fontSize: '12px' }}>{a.assessedBy?.name || '-'}</td>
                      <td style={{ fontSize: '12px' }}>{format(new Date(a.assessmentDate), 'dd/MM/yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportGenerator;
