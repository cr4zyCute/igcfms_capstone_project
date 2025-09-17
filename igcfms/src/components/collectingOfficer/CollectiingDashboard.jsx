import React from 'react';
import IssueReceipt from './IssueReceipt';
import ReceiveMoney from './ReceiveMoney';
import CollectorHome from './CollectorHome';
import '../pages/css/Dashboard.css';
import '../common/css/Sidebar.css';

const CollectingDashboard = ({ user, activeTab }) => {
 
  switch(activeTab){
    case "issue-receipt":
      return <IssueReceipt/>;
    case "receive-money":
      return <ReceiveMoney/>;
    default: 
    return <CollectorHome user={user}/>;
  }


};

export default CollectingDashboard;