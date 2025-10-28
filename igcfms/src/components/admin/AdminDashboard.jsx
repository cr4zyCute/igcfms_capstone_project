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
import RecipientAccount from "./RecipientAccount";
import OverrideTransactions from "./OverrideTransactions";
import SystemSettings from "./SystemSettings";
import TransactionManagement from "./TransactionManagement";
import ActivityDashboard from "./ActivityDashboard";
import NotificationBar from "./NotificationBar";
import ProfileSettings from "./ProfileSettings";
import '../pages/css/Dashboard.css';

const AdminDashboard = ({ user, activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome user={user} />;
      case "notifications":
        return <NotificationBar />;
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
        return <GenerateReports user={user} />;
      case "manage-staff":
        return <ManageStaff />;
      case "funds-accounts":
        return <FundsAccounts />;
      case "recipient-account":
        return <RecipientAccount />;
      case "override-transactions":
        return <OverrideTransactions />;
      case "system-settings":
        return <SystemSettings />;
      case "transaction-management":
        return <TransactionManagement />;
      case "activity-dashboard":
        return <ActivityDashboard />;
      case "profile-settings":
        return <ProfileSettings />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return <div className="dashboard-content">{renderTabContent()}</div>;
};

export default AdminDashboard;
