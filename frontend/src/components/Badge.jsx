import React from 'react';

const Badge = ({ riskCategory }) => {
  const getBadgeClass = () => {
    switch (riskCategory) {
      case 'HIGH': return 'badge-high';
      case 'MODERATE': return 'badge-moderate';
      case 'LOW': return 'badge-low';
      default: return '';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {riskCategory}
    </span>
  );
};

export default Badge;
