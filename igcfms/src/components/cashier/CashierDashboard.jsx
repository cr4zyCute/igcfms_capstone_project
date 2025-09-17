import React from "react";
import ViewTransactions from './ViewTransactions';
import FundsAccounts from './FundsAccounts';
import OverrideTransactions from './OverrideTransactions';
import GenerateReports from './GenerateReports';


const CashierDashboard = ({ activeTab }) => {
  switch (activeTab) {
    case "generate-reports":
      return <GenerateReports />;
    case "override-transactions":
      return <OverrideTransactions/>;
    case "view-transactions":
      return <ViewTransactions />;
    case "funds-accounts":
      return <FundsAccounts/>;
    case "daily-summary":
      return <div>Daily summary content here</div>;
    default:
      return <div>Welcome to Cashier Dashboard</div>;
  }
};

export default CashierDashboard;
