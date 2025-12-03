import React from 'react';
import IssueReceiptComponent from '../admin/IssueReceipt';
import { useAuth } from '../../contexts/AuthContext';

const CollectingOfficerIssueReceipt = () => {
  const { user } = useAuth();

  // Wrap the IssueReceipt component and pass user context for filtering
  // Pass multiple user identifiers to handle different data structures
  return (
    <IssueReceiptComponent 
      isCollectingOfficer={true} 
      currentUserId={user?.id}
      currentUser={user}
    />
  );
};

export default CollectingOfficerIssueReceipt;