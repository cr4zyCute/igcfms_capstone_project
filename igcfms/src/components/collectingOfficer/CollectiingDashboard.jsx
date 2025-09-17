import React from 'react';
import IssueReceipt from './IssueReceipt';
import ReceiveMoney from './ReceiveMoney';

const CollectingDashboard = ({ activeTab }) => {
 
  switch(activeTab){
    case "issue-receipt":
      return <IssueReceipt/>;
    case "receive-money":
      return <ReceiveMoney/>;
    default: 
    return <div>Welcom to Collector Dashboard</div>
  }


};

export default CollectingDashboard;