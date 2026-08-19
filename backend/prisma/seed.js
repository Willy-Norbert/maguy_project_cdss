require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const nursePassword = await bcrypt.hash('nurse123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { name: 'System Admin', username: 'admin', password: adminPassword, role: 'ADMIN' },
  });

  const doctor = await prisma.user.upsert({
    where: { username: 'dr.uwase' },
    update: {},
    create: { name: 'Dr. Uwase', username: 'dr.uwase', password: doctorPassword, role: 'DOCTOR' },
  });

  const nurse = await prisma.user.upsert({
    where: { username: 'n.keza' },
    update: {},
    create: { name: 'Nurse Keza', username: 'n.keza', password: nursePassword, role: 'NURSE' },
  });

  console.log('Users created.');

  // 2. Create Patients
  const patientsData = [
    { name: 'Alice Mutoni',        age: 24, gestationalAge: 22, weight: 65,  height: 160, previousPregnancies: 0, bmi: 25.39 },
    { name: 'Beatrice Umutoni',    age: 36, gestationalAge: 30, weight: 85,  height: 165, previousPregnancies: 2, bmi: 31.22, medicalHistory: 'Hypertension in previous pregnancy' },
    { name: 'Chantal Uwamahoro',   age: 19, gestationalAge: 28, weight: 55,  height: 155, previousPregnancies: 0, bmi: 22.89 },
    { name: 'Diane Kanyana',       age: 29, gestationalAge: 35, weight: 70,  height: 162, previousPregnancies: 1, bmi: 26.67 },
    { name: 'Elise Mukantagara',   age: 31, gestationalAge: 20, weight: 90,  height: 158, previousPregnancies: 3, bmi: 36.05 },
    { name: 'Fatuma Nyiraneza',    age: 26, gestationalAge: 38, weight: 68,  height: 168, previousPregnancies: 1, bmi: 24.09 },
    { name: 'Grace Uwiringiyimana',age: 22, gestationalAge: 24, weight: 60,  height: 160, previousPregnancies: 0, bmi: 23.44 },
    { name: 'Helen Murekatete',    age: 38, gestationalAge: 32, weight: 80,  height: 155, previousPregnancies: 4, bmi: 33.30 },
  ];

  const patients = [];
  for (let i = 0; i < patientsData.length; i++) {
    const p = await prisma.patient.upsert({
      where: { patientCode: `PT-${String(i + 1).padStart(4, '0')}` },
      update: {},
      create: { patientCode: `PT-${String(i + 1).padStart(4, '0')}`, ...patientsData[i] }
    });
    patients.push(p);
  }
  console.log('Patients created.');

  // 3. Create Assessments
  const { calculateRisk } = require('../src/services/riskEngine');

  const createAssessment = async (patient, user, data, dateOffsetDays, status = null, outcome = null, reviewedByUser = null) => {
    const riskResult = calculateRisk({ ...data, bmi: patient.bmi, age: patient.age });
    const date = new Date();
    date.setDate(date.getDate() - dateOffsetDays);

    // Auto-assign status based on risk category unless overridden
    let autoStatus = riskResult.riskCategory === 'LOW' ? 'ROUTINE' : 'PENDING_REVIEW';
    if (status) autoStatus = status;

    const reviewData = (autoStatus === 'REVIEWED' && reviewedByUser) ? {
      reviewedById: reviewedByUser.id,
      reviewedAt: new Date(date.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      clinicalOutcome: outcome,
      doctorNotes: 'Patient reviewed and clinical decision recorded.'
    } : {};

    await prisma.assessment.create({
      data: {
        patientId: patient.id,
        assessedById: user.id,
        assessmentDate: date,
        systolicBP: data.systolicBP,
        diastolicBP: data.diastolicBP,
        urineProtein: data.urineProtein,
        previousPreeclampsia: data.previousPreeclampsia || false,
        diabetes: data.diabetes || false,
        chronicHypertension: data.chronicHypertension || false,
        kidneyDisease: data.kidneyDisease || false,
        familyHistory: data.familyHistory || false,
        map: riskResult.map,
        riskScore: riskResult.riskScore,
        riskCategory: riskResult.riskCategory,
        contributingFactors: riskResult.contributingFactors,
        recommendations: riskResult.recommendations,
        status: autoStatus,
        ...reviewData
      }
    });
  };

  // HIGH risk - Nurse submitted, still PENDING_REVIEW
  await createAssessment(patients[0], nurse, { systolicBP: 165, diastolicBP: 105, urineProtein: 3, previousPreeclampsia: true }, 2);
  // HIGH risk - Reviewed by doctor
  await createAssessment(patients[1], nurse, { systolicBP: 150, diastolicBP: 95, urineProtein: 2, chronicHypertension: true }, 15, 'REVIEWED', 'REFERRED_TO_SPECIALIST', doctor);
  // HIGH risk - Reviewed
  await createAssessment(patients[7], nurse, { systolicBP: 160, diastolicBP: 110, urineProtein: 3, familyHistory: true }, 20, 'REVIEWED', 'ADMITTED', doctor);

  // MODERATE risk - Nurse submitted, PENDING_REVIEW
  await createAssessment(patients[3], nurse, { systolicBP: 135, diastolicBP: 88, urineProtein: 1 }, 5);
  // MODERATE risk - Reviewed
  await createAssessment(patients[4], nurse, { systolicBP: 120, diastolicBP: 80, urineProtein: 0, familyHistory: true, diabetes: true }, 30, 'REVIEWED', 'FOLLOW_UP_SCHEDULED', doctor);

  // LOW risk - routine, no doctor review needed
  await createAssessment(patients[2], nurse, { systolicBP: 110, diastolicBP: 70, urineProtein: 0 }, 10);
  await createAssessment(patients[5], nurse, { systolicBP: 115, diastolicBP: 75, urineProtein: 0 }, 40);
  await createAssessment(patients[6], nurse, { systolicBP: 105, diastolicBP: 65, urineProtein: 0 }, 2);

  // Older trend data
  await createAssessment(patients[0], nurse, { systolicBP: 140, diastolicBP: 90, urineProtein: 1, previousPreeclampsia: true }, 45, 'REVIEWED', 'TREATMENT_STARTED', doctor);
  await createAssessment(patients[1], nurse, { systolicBP: 145, diastolicBP: 90, urineProtein: 0, chronicHypertension: true }, 50, 'REVIEWED', 'FOLLOW_UP_SCHEDULED', doctor);

  console.log('Assessments created.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
