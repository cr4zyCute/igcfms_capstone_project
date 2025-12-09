import React from 'react';
import GenerateReportsComponent from '../admin/GenerateReports';
import { useAuth } from '../../contexts/AuthContext';

const CashierGenerateReports = () => {
  const { user } = useAuth();

  return (
    <GenerateReportsComponent 
      user={user}
      currentUserId={user?.id}
      currentUser={user}
      hideTransactionTab={false}
      hideOverrideTab={false}
      hideCollectionReportTab={false}
      filterTransactionsByCreator={true}
      hideTransactionActions={true}
    />
  );
};

export default CashierGenerateReports;