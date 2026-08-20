/**
 * Risk Scoring Engine
 * Deterministic rule-based engine for Early Detection of Preeclampsia.
 */

const calculateRisk = (data) => {
  let riskScore = 0;
  const contributingFactors = [];

  // 1. Calculate MAP
  const map = (data.systolicBP + 2 * data.diastolicBP) / 3;

  // 2. Blood pressure scoring (highest tier only)
  if (data.systolicBP >= 160 || data.diastolicBP >= 110) {
    riskScore += 40;
    contributingFactors.push(`Blood pressure: ${data.systolicBP}/${data.diastolicBP} (severe)`);
  } else if (data.systolicBP >= 140 || data.diastolicBP >= 90) {
    riskScore += 25;
    contributingFactors.push(`Blood pressure: ${data.systolicBP}/${data.diastolicBP} (high)`);
  } else if (data.systolicBP >= 130 || data.diastolicBP >= 85) {
    riskScore += 10;
    contributingFactors.push(`Blood pressure: ${data.systolicBP}/${data.diastolicBP} (elevated)`);
  }

  // 3. Urine protein scoring (0=Negative, 1=Trace, 2=1+, 3=2+, 4=3+/4+)
  if (data.urineProtein >= 3) {
    riskScore += 20;
    const label = data.urineProtein === 4 ? '3+/4+' : '2+';
    contributingFactors.push(`Positive urine protein (${label})`);
  } else if (data.urineProtein === 2) {
    riskScore += 12;
    contributingFactors.push('Positive urine protein (1+)');
  } else if (data.urineProtein === 1) {
    riskScore += 5;
    contributingFactors.push('Urine protein (trace)');
  }

  // 4. Other conditions
  if (data.previousPreeclampsia) {
    riskScore += 18;
    contributingFactors.push('Previous history of preeclampsia');
  }
  if (data.chronicHypertension) {
    riskScore += 12;
    contributingFactors.push('Chronic hypertension');
  }
  if (data.kidneyDisease) {
    riskScore += 10;
    contributingFactors.push('Kidney disease');
  }
  if (data.diabetes) {
    riskScore += 8;
    contributingFactors.push('Diabetes');
  }
  if (data.bmi && data.bmi >= 30) {
    riskScore += 8;
    contributingFactors.push('BMI ≥ 30 (Obesity)');
  }
  if (data.familyHistory) {
    riskScore += 6;
    contributingFactors.push('Family history of preeclampsia');
  }
  if (data.age && (data.age < 20 || data.age > 35)) {
    riskScore += 5;
    contributingFactors.push(`Maternal age (${data.age} yrs) is < 20 or > 35`);
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  // 5. Classification and Recommendations
  let riskCategory = 'LOW';
  let recommendations = [];

  if (riskScore >= 60) {
    riskCategory = 'HIGH';
    recommendations = [
      'Refer to obstetric specialist immediately',
      'Schedule weekly monitoring',
      'Repeat laboratory tests (FBC, LFTs, Creatinine)',
      'Consider preventive treatment according to clinical guidelines'
    ];
  } else if (riskScore >= 40) {
    riskCategory = 'MODERATE';
    recommendations = [
      'Increase monitoring frequency (every 1–2 weeks)',
      'Repeat blood pressure and urine protein tests',
      'Counsel patient on preeclampsia warning signs',
      'Reassess at next antenatal visit'
    ];
  } else {
    riskCategory = 'LOW';
    recommendations = [
      'Continue routine antenatal care',
      'Monitor at next scheduled visit',
      'Educate patient on preeclampsia warning signs'
    ];
  }

  return {
    map: Number(map.toFixed(2)),
    riskScore,
    riskCategory,
    contributingFactors,
    recommendations
  };
};

module.exports = { calculateRisk };
