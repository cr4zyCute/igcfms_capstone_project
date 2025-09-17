import React from "react";
import DashboardHome from "./DashboardHome";
import ReceiveMoney from "./ReceiveMoney";
import IssueReceipt from "./IssueReceipt";
import IssueMoney from "./IssueMoney";
import IssueCheque from "./IssueCheque";
import ViewTransactions from "./ViewTransactions";
import GenerateReports from "./GenerateReports";
import ManageStaff from "./ManageStaff";
import FundsAccounts from "./FundsAccounts";
import OverrideTransactions from "./OverrideTransactions";
import SystemSettings from "./SystemSettings";
import '../pages/css/Dashboard.css';

const AdminDashboard = ({ user, activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome user={user} />;
      case "receive-money":
        return <ReceiveMoney />;
      case "issue-receipt":
        return <IssueReceipt />;
      case "issue-money":
        return <IssueMoney />;
      case "issue-check":
        return <IssueCheque />;
      case "view-transactions":
        return <ViewTransactions />;
      case "generate-reports":
        return <GenerateReports />;
      case "manage-staff":
        return <ManageStaff />;
      case "funds-accounts":
        return <FundsAccounts />;
      case "override-transactions":
        return <OverrideTransactions />;
      case "system-settings":
        return <SystemSettings />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return <div className="dashboard-content">{renderTabContent()}</div>;
};

export default AdminDashboard;
