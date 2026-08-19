const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/stats
 * Role-specific dashboard stats:
 * - NURSE: her own submissions, pending/routine counts
 * - DOCTOR: pending review queue count + analytics
 * - ADMIN: aggregate counts only, no patient details
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    // Helper to get trends for sparklines (last 7 days) and main chart (last 30 days)
    const getTrends = async (whereClause, days) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      const assessments = await prisma.assessment.findMany({
        where: { ...whereClause, assessmentDate: { gte: date } },
        select: { assessmentDate: true, riskCategory: true },
        orderBy: { assessmentDate: 'asc' }
      });
      const map = {};
      assessments.forEach(a => {
        const d = a.assessmentDate.toISOString().split('T')[0];
        if (!map[d]) map[d] = { date: d, HIGH: 0, MODERATE: 0, LOW: 0, total: 0 };
        map[d][a.riskCategory]++;
        map[d].total++;
      });
      return Object.values(map);
    };

    // Helper to get risk counts
    const getRiskCounts = async (whereClause) => {
      const counts = await prisma.assessment.groupBy({
        by: ['riskCategory'],
        where: whereClause,
        _count: { riskCategory: true }
      });
      const result = { HIGH: 0, MODERATE: 0, LOW: 0 };
      counts.forEach(c => { result[c.riskCategory] = c._count.riskCategory; });
      return result;
    };

    const totalPatients = await prisma.patient.count();
    let stats = { totalPatients };
    let payload = { role, stats };

    if (role === 'ADMIN') {
      const totalAssessments = await prisma.assessment.count();
      stats = { ...stats, totalAssessments, ...(await getRiskCounts({})) };
      payload.trends = await getTrends({}, 30);
      payload.sparklines = await getTrends({}, 7);
    } 
    else if (role === 'NURSE') {
      const myAssessments = await prisma.assessment.count({ where: { assessedById: userId } });
      stats = { ...stats, myAssessments, ...(await getRiskCounts({ assessedById: userId })) };
      payload.trends = await getTrends({ assessedById: userId }, 30);
      payload.sparklines = await getTrends({ assessedById: userId }, 7);
      
      payload.recentAssessments = await prisma.assessment.findMany({
        where: { assessedById: userId },
        take: 8,
        orderBy: { assessmentDate: 'desc' },
        include: { patient: { select: { name: true, patientCode: true } }, assessedBy: { select: { name: true } } }
      });
    } 
    else if (role === 'DOCTOR') {
      const pendingReview = await prisma.assessment.count({ where: { status: 'PENDING_REVIEW' } });
      const reviewedToday = await prisma.assessment.count({
        where: { status: 'REVIEWED', reviewedById: userId, reviewedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
      });
      stats = { ...stats, pendingReview, reviewedToday, ...(await getRiskCounts({})) };
      payload.trends = await getTrends({}, 30);
      payload.sparklines = await getTrends({}, 7);

      payload.pendingQueue = await prisma.assessment.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: [{ riskCategory: 'asc' }, { assessmentDate: 'asc' }],
        take: 20,
        include: { patient: { select: { name: true, patientCode: true, age: true, gestationalAge: true } }, assessedBy: { select: { name: true } } }
      });
      payload.recentAssessments = await prisma.assessment.findMany({
        take: 8,
        orderBy: { assessmentDate: 'desc' },
        include: { patient: { select: { name: true, patientCode: true } }, assessedBy: { select: { name: true } } }
      });
    }

    payload.stats = stats;
    return res.json(payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
