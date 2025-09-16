// src/utils/navigationConfig.js
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiDollarSign,
  FiCalendar,
  FiClipboard,
  FiPieChart,
  FiBook,
  FiShoppingCart,
  FiCreditCard,
  FiArchive,
  FiTrendingUp
} from 'react-icons/fi';

export const navigationConfig = {
  admin: {
    sidebar: [
      { title: 'Dashboard', path: '/admin/dashboard', icon: <FiHome /> },
      { title: 'Staff Management', path: '/admin/staff', icon: <FiUsers /> },
      { title: 'Financial Reports', path: '/admin/reports', icon: <FiTrendingUp /> },
      { title: 'System Settings', path: '/admin/settings', icon: <FiSettings /> },
    ],
  },
  cashier: {
    sidebar: [
      { title: 'Dashboard', path: '/cashier/dashboard', icon: <FiHome /> },
      { title: 'Point of Sale', path: '/cashier/pos', icon: <FiShoppingCart /> },
      { title: 'Transactions', path: '/cashier/transactions', icon: <FiCreditCard /> },
    ],
  },
  collectingOfficer: {
    sidebar: [
      { title: 'Dashboard', path: '/collecting/dashboard', icon: <FiHome /> },
      { title: 'Collect Payments', path: '/collecting/payments', icon: <FiDollarSign /> },
      { title: 'Payment Records', path: '/collecting/records', icon: <FiClipboard /> },
    ],
  },
  disbursingOfficer: {
    sidebar: [
      { title: 'Dashboard', path: '/disbursing/dashboard', icon: <FiHome /> },
      { title: 'Disbursements', path: '/disbursing/transactions', icon: <FiCreditCard /> },
      { title: 'Budget Management', path: '/disbursing/budget', icon: <FiArchive /> },
    ],
  },
};

export const getNavigationConfig = (role) => {
  return navigationConfig[role] || { sidebar: [] };
};