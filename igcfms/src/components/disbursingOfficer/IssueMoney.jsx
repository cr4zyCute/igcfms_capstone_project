import React from 'react';
import IssueMoney from '../admin/IssueMoney';
import './css/issuemoneyDO.css';

/**
 * Disbursing Officer IssueMoney Wrapper
 * 
 * Shows only:
 * - Recent Disbursements table (hides KPI dashboard)
 * - Transactions created by the current disbursing officer
 * 
 * Admins see the full dashboard with all transactions and KPI metrics
 */
const IssuemoneyDO = () => {
  const userId = localStorage.getItem('userId');
  
  return (
    <div className="issue-money-do-wrapper">
      <IssueMoney filterByUserId={userId} hideKpiDashboard={true} />
    </div>
  );
};

export default IssuemoneyDO;
