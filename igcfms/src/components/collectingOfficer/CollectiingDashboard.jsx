import React, { useMemo } from 'react';
import IssueReceipt from './IssueReceipt';
import ReceiveMoney from './ReceiveMoney';
import CollectorHome from './CollectorHome';
import GenerateReports from '../admin/GenerateReports';
import ViewTransactions from '../admin/ViewTransactions';
import '../pages/css/Dashboard.css';
import '../common/css/Sidebar.css';

const CollectingDashboard = ({ user, activeTab }) => {
  const assignedAccountIds = useMemo(() => {
    if (!user) return [];

    const ids = [];

    if (Array.isArray(user.assigned_accounts)) {
      user.assigned_accounts.forEach(acc => {
        if (acc?.fund_account_id) ids.push(acc.fund_account_id);
        else if (acc?.id) ids.push(acc.id);
      });
    }

    if (user.fund_account_id) ids.push(user.fund_account_id);
    if (user.fundAccountId) ids.push(user.fundAccountId);

    return ids
      .map(id => parseInt(id, 10))
      .filter(Number.isFinite);
  }, [user]);

  const creatorId = useMemo(() => {
    if (!user) return null;
    const possibleIds = [user.id, user.user_id, user.userId];
    const parsed = possibleIds
      .map(id => parseInt(id, 10))
      .find(Number.isFinite);
    return parsed ?? null;
  }, [user]);
 
  switch(activeTab){
    case "issue-receipt":
      return <IssueReceipt/>;
    case "receive-money":
      return <ReceiveMoney/>;
    case "generate-reports":
      return <GenerateReports user={user} />;
    case "view-transactions":
      return (
        <ViewTransactions
          filterByAccountIds={assignedAccountIds.length > 0 ? assignedAccountIds : undefined}
          filterByCreatorId={creatorId ?? undefined}
        />
      );
    case "daily-summary":
      return <div>Daily Summary - Coming Soon</div>;
    default: 
      return <CollectorHome user={user}/>;
  }



};

export default CollectingDashboard;