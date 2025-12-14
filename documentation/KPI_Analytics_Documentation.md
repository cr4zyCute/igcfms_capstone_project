# KPI Analytics Documentation

## 1. Overview
The KPI (Key Performance Indicator) Analytics system provides real-time visualization of financial and operational metrics in the IGCFMS admin dashboard.

## 2. Key Components
- **KPIAnalytics.jsx**: Main component for rendering metrics and charts
- **useKPIData.js**: Handles data fetching with TanStack Query
- **useKPIWebSocket.js**: Manages real-time WebSocket updates

## 3. Key Metrics
- Days Payable Outstanding (DPO)
- Payment Accuracy Rate
- Vendor Performance
- Payment Method Distribution
- Transaction Volumes
- Error Rates

## 4. Real-time Updates
- Uses WebSockets for instant data updates
- Connected to '/kpi' endpoint
- Automatic UI refresh on data changes

## 5. Technical Stack
- **Frontend**: React 18+
- **State Management**: TanStack Query
- **Charts**: Chart.js
- **Styling**: CSS Modules

## 6. Location in Project
```
igcfms/
  src/
    components/
      admin/
        KPIAnalytics.jsx    # Main component
    hooks/
      useKPIData.js         # Data fetching
      useKPIWebSocket.js    # Real-time updates
```

## 7. Usage
```jsx
import KPIAnalytics from './components/admin/KPIAnalytics';

function Dashboard() {
  return (
    <div>
      <h1>Financial Dashboard</h1>
      <KPIAnalytics />
    </div>
  );
}
```

## 8. Dependencies
- react
- chart.js
- @tanstack/react-query
- socket.io-client

*Document generated on 2025-12-10*
