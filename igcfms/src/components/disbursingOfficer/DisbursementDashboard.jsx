import React from 'react';
import IssueMoney from './IssueMoney';
import IssueCheque from './IssueCheque';

const DisbursementDashboard = ({ activeTab }) => {
 
  switch(activeTab){
    case "issue-money":
      return <IssueMoney/>;
    case "issue-cheque":
      return <IssueCheque/>;
    default: 
    return <div>Welcom to Collector Dashboard</div>
  }


};

export default DisbursementDashboard;