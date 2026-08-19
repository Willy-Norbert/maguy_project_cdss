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

// High-risk list — Admin blocked
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

module.exports = router;
