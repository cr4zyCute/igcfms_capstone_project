import React from 'react';
import GenerateReportsComponent from '../admin/GenerateReports';
import { useAuth } from '../../contexts/AuthContext';
import DisburserKPIs from './DisburserKPIs';

const DisbursingOfficerGenerateReports = () => {
  const { user } = useAuth();

  return (
    <div className="disburser-page">
      <DisburserKPIs />
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
    </div>
  );
};

export default DisbursingOfficerGenerateReports;
