import React from 'react';
import IssueMoney from './IssueMoney';
import IssueCheque from './IssueCheque';
import DisburserHome from './DisburserHome';
import GenerateReports from '../admin/GenerateReports';

const DisbursementDashboard = ({ user, activeTab }) => {
 
  switch(activeTab){
    case "issue-money":
      return <IssueMoney/>;
    case "issue-cheque":
      return <IssueCheque/>;
    case "generate-reports":
      return <GenerateReports user={user} />;
    case "view-transactions":
      return <div>View Transactions - Coming Soon</div>;
    case "daily-summary":
      return <div>Daily Summary - Coming Soon</div>;
    default: 
      return <DisburserHome user={user}/>
  }


};

export default DisbursementDashboard;