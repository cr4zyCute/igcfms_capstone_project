import React from 'react';
import GenerateReportsComponent from '../admin/GenerateReports';
import { useAuth } from '../../contexts/AuthContext';

const CollectingOfficerGenerateReports = () => {
  const { user } = useAuth();
  return (
    <GenerateReportsComponent 
      user={user}
      isCollectingOfficer={true} 
      currentUserId={user?.id}
      currentUser={user}
      hideTransactionTab={false}
      hideOverrideTab={true}
      hideCollectionReportTab={true}
      filterTransactionsByCreator={true}
    />
  );
};

export default CollectingOfficerGenerateReports;
