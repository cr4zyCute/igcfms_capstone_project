import React from 'react';
import IssueCheque from "../admin/IssueCheque";

/**
 * Disbursing Officer IssueCheque Wrapper
 * 
 * Shows only:
 * - Recent Cheques table (hides KPI dashboard)
 * - Cheques created by the current disbursing officer
 * 
 * Admins see the full dashboard with all cheques and KPI metrics
 */
const DisbursingOfficerIssueCheque = () => {
  const userId = localStorage.getItem('userId');
  
  return (
    <IssueCheque 
      filterByUserId={userId} 
      hideKpiDashboard={true} 
    />
  );
};

export default DisbursingOfficerIssueCheque;