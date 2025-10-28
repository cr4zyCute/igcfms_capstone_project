import React from 'react';
import IssueReceipt from './IssueReceipt';
import ReceiveMoney from './ReceiveMoney';
import CollectorHome from './CollectorHome';
import GenerateReports from '../admin/GenerateReports';
import '../pages/css/Dashboard.css';
import '../common/css/Sidebar.css';

const CollectingDashboard = ({ user, activeTab }) => {
 
  switch(activeTab){
    case "issue-receipt":
      return <IssueReceipt/>;
    case "receive-money":
      return <ReceiveMoney/>;
    case "generate-reports":
      return <GenerateReports user={user} />;
    case "view-transactions":
      return <div>View Transactions - Coming Soon</div>;
    case "daily-summary":
      return <div>Daily Summary - Coming Soon</div>;
    default: 
      return <CollectorHome user={user}/>;
  }


};

export default CollectingDashboard;