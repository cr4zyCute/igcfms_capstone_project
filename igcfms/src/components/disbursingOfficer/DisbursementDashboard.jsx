import React from 'react';
import IssueMoney from './IssueMoney';
import IssueCheque from './IssueCheque';
import DisburserHome from './DisburserHome';

const DisbursementDashboard = ({ user,activeTab }) => {
 
  switch(activeTab){
    case "issue-money":
      return <IssueMoney/>;
    case "issue-cheque":
      return <IssueCheque/>;
    default: 
    return <DisburserHome user={user}/>
  }


};

export default DisbursementDashboard;