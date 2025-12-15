import React from 'react';
import IssueMoney from './IssueMoney';
import IssueCheque from './IssueCheque';
import DisburserHome from './DisburserHome';
import GenerateReports from './GenerateReports';
import OverrideTransactions from './OverrideTransactions';
import NotificationBellDO from './NotificationBellDO';
import ProfileSettings from './ProfileSettings';

const DisbursementDashboard = ({ user, activeTab }) => {
 
  switch(activeTab){
    case "issue-money":
      return <IssueMoney/>;
    case "issue-cheque":
      return <IssueCheque/>;
    case "notifications":
      return <NotificationBellDO />;
    case "generate-reports":
      return <GenerateReports />;
    case "override-transactions":
      return <OverrideTransactions/>;
    case "profile-settings":
      return <ProfileSettings />;
    case "view-transactions":
      return <div>View Transactions - Coming Soon</div>;
    case "daily-summary":
      return <div>Daily Summary - Coming Soon</div>;
    default: 
      return <DisburserHome user={user}/>
  }
};

export default DisbursementDashboard;