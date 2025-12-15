import React from "react";
import ViewTransactions from './ViewTransactions';
import FundsAccounts from './FundsAccounts';
import OverrideTransactions from './OverrideTransactions';
import GenerateReports from './GenerateReports';
import RecipientAccount from '../admin/RecipientAccount';
import CashierHome from '../cashier/CashierHome';
import ProfileSettings from './ProfileSettings';
import '../pages/css/Dashboard.css';
import '../common/css/Sidebar.css';



const CashierDashboard = ({ user,activeTab }) => {
  switch (activeTab) {
    case "generate-reports":
      return <GenerateReports user={user} />;
    case "override-transactions":
      return <OverrideTransactions/>;
    case "view-transactions":
      return <ViewTransactions />;
    case "recipient-account":
      return <RecipientAccount />;
    case "funds-accounts":
      return <FundsAccounts/>;
    case "profile-settings":
      return <ProfileSettings />;
    case "daily-summary":
      return <div>Daily summary content here</div>;
    default:
      return <CashierHome user={user}/>;
  }
};

export default CashierDashboard;
