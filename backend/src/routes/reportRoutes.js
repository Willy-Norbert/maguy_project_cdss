const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// Get assessment by id
router.get('/assessment/:id', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: true,
        assessedBy: { select: { name: true, role: true } },
        reviewedBy: { select: { name: true } }
      }
    });
    if (!assessment) return res.status(404).json({ error: 'Not found' });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Doctor review an assessment — DOCTOR only
router.patch('/assessment/:id/review', authMiddleware, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const { clinicalOutcome, doctorNotes } = req.body;
    const assessment = await prisma.assessment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'REVIEWED',
        reviewedById: req.user.id,
        reviewedAt: new Date(),
        clinicalOutcome,
        doctorNotes
      },
      include: {
        patient: true,
        assessedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }
      }
    });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to review assessment' });
  }
});

// All assessments — Full registry with score-based live risk label
router.get('/all-assessments', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { assessmentDate: 'desc' },
      include: {
        patient: { select: { name: true, patientCode: true, gestationalAge: true, age: true } },
        assessedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }
      }
    });

    // Re-derive riskCategory from score at query time so it's always correct
    const getRiskFromScore = (score) => {
      if (score >= 60) return 'HIGH';
      if (score >= 40) return 'MODERATE';
      return 'LOW';
    };

    const enriched = assessments.map(a => ({
      ...a,
      riskCategory: getRiskFromScore(a.riskScore)   // override stored value with live calculation
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// High-risk list
router.get('/high-risk', authMiddleware, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { riskCategory: 'HIGH' },
      include: {
        patient: true,
        assessedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }
      },
      orderBy: { assessmentDate: 'desc' }
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch high-risk reports' });
  }
});

// Trends
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { range } = req.query;
    const date = new Date();
    if (range === '90d') date.setDate(date.getDate() - 90);
    else if (range === '1y') date.setFullYear(date.getFullYear() - 1);
    else date.setDate(date.getDate() - 30);

    const assessments = await prisma.assessment.findMany({
      where: { assessmentDate: { gte: date } },
      select: { assessmentDate: true, riskCategory: true },
      orderBy: { assessmentDate: 'asc' }
    });

    const trendsMap = {};
    assessments.forEach(a => {
      const dStr = a.assessmentDate.toISOString().split('T')[0];
      if (!trendsMap[dStr]) trendsMap[dStr] = { date: dStr, HIGH: 0, MODERATE: 0, LOW: 0 };
      trendsMap[dStr][a.riskCategory]++;
    });

    res.json(Object.values(trendsMap));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// System Report — ADMIN only
router.get('/system-report', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalAssessments = await prisma.assessment.count();
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });

    const riskCounts = await prisma.assessment.groupBy({
      by: ['riskCategory'],
      _count: { riskCategory: true }
    });
    const riskSummary = { HIGH: 0, MODERATE: 0, LOW: 0 };
    riskCounts.forEach(r => { riskSummary[r.riskCategory] = r._count.riskCategory; });

    const statusCounts = await prisma.assessment.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    const statusSummary = { ROUTINE: 0, PENDING_REVIEW: 0, REVIEWED: 0 };
    statusCounts.forEach(s => { statusSummary[s.status] = s._count.status; });

    const recentAssessments = await prisma.assessment.findMany({
      take: 50,
      orderBy: { assessmentDate: 'desc' },
      include: {
        patient: { select: { name: true, patientCode: true, gestationalAge: true, age: true } },
        assessedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }
      }
    });

    const allPatients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        assessments: {
          take: 1,
          orderBy: { assessmentDate: 'desc' },
          select: { riskCategory: true, riskScore: true, status: true, assessmentDate: true }
        }
      }
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true }
    });

    res.json({
      generatedAt: new Date().toISOString(),
      summary: { totalPatients, totalAssessments, totalUsers, activeUsers, riskSummary, statusSummary },
      recentAssessments,
      patients: allPatients,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate system report' });
  }
});

module.exports = router;
