const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { calculateRisk } = require('../services/riskEngine');

const prisma = new PrismaClient();

// Get all patients (searchable) — Admin blocked
router.get('/', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { patientCode: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by id — Admin blocked
router.get('/:id', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assessments: {
          orderBy: { assessmentDate: 'desc' },
          include: {
            assessedBy: { select: { name: true, role: true } },
            reviewedBy: { select: { name: true } }
          }
        }
      }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient — Admin blocked
router.post('/', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const data = req.body;
    const bmi = data.weight / Math.pow(data.height / 100, 2);
    const count = await prisma.patient.count();
    const patientCode = `PT-${String(count + 1).padStart(4, '0')}`;

    const patient = await prisma.patient.create({
      data: { ...data, bmi: Number(bmi.toFixed(2)), patientCode }
    });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient — Admin only
router.put('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const data = req.body;
    const bmi = data.weight / Math.pow(data.height / 100, 2);
    const patient = await prisma.patient.update({
      where: { id: parseInt(req.params.id) },
      data: { ...data, bmi: Number(bmi.toFixed(2)) }
    });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Create assessment — Admin blocked
router.post('/:id/assessments', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const data = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const riskResult = calculateRisk({ ...data, bmi: patient.bmi, age: patient.age });

    // Auto-assign status: LOW = ROUTINE, else = PENDING_REVIEW
    const status = riskResult.riskCategory === 'LOW' ? 'ROUTINE' : 'PENDING_REVIEW';

    const assessment = await prisma.assessment.create({
      data: {
        patientId,
        assessedById: req.user.id,
        systolicBP: data.systolicBP,
        diastolicBP: data.diastolicBP,
        urineProtein: data.urineProtein,
        bloodGlucose: data.bloodGlucose,
        previousPreeclampsia: data.previousPreeclampsia || false,
        diabetes: data.diabetes || false,
        chronicHypertension: data.chronicHypertension || false,
        kidneyDisease: data.kidneyDisease || false,
        familyHistory: data.familyHistory || false,
        labResults: data.labResults,
        map: riskResult.map,
        riskScore: riskResult.riskScore,
        riskCategory: riskResult.riskCategory,
        contributingFactors: riskResult.contributingFactors,
        recommendations: riskResult.recommendations,
        status
      },
      include: {
        assessedBy: { select: { name: true } },
        patient: true
      }
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Delete patient — Admin only
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.patient.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
