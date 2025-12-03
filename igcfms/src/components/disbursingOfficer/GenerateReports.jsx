import React from 'react';
import GenerateReportsComponent from '../admin/GenerateReports';
import { useAuth } from '../../contexts/AuthContext';

const DisbursingOfficerGenerateReports = () => {
  const { user } = useAuth();

  
  return (
    <GenerateReportsComponent 
      user={user}
      isDisbursing={true} 
      currentUserId={user?.id}
      currentUser={user}
      hideTransactionTab={true}
      hideOverrideTab={true}
      hideCollectionReportTab={true}
      filterTransactionsByCreator={true}
      hideTransactionActions={true}
    />
  );
};

export default DisbursingOfficerGenerateReports;
