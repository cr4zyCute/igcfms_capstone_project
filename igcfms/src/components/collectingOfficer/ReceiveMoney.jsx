import React from 'react';
import ReceiveMoneyComponent from '../admin/ReceiveMoney';
import { useAuth } from '../../contexts/AuthContext';

const CollectingOfficerReceiveMoney = () => {
  const { user } = useAuth();

  // Wrap the ReceiveMoney component and pass user context for filtering
  return <ReceiveMoneyComponent isCollectingOfficer={true} currentUserId={user?.id} />;
};

export default CollectingOfficerReceiveMoney;