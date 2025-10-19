import React from 'react';
import './css/bargraph.css';

const BarGraph = ({ overrideRequests }) => {
  // ============ MOCK DATA TOGGLE ============
  const USE_MOCK_DATA = false; // Set to true to use mock data
  // ==========================================

  let dailyData;

  if (USE_MOCK_DATA) {
    // Mock data for demonstration
    dailyData = {
      'Oct 13': { pending: 3, approved: 2, rejected: 1 },
      'Oct 14': { pending: 5, approved: 3, rejected: 2 },
      'Oct 15': { pending: 2, approved: 4, rejected: 1 },
      'Oct 16': { pending: 6, approved: 2, rejected: 3 },
      'Oct 17': { pending: 4, approved: 5, rejected: 1 },
      'Oct 18': { pending: 7, approved: 3, rejected: 2 },
      'Oct 19': { pending: 5, approved: 4, rejected: 2 }
    };
  } else {
    // Real data from override requests
    dailyData = overrideRequests.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { pending: 0, approved: 0, rejected: 0 };
      }
      acc[date][item.status] = (acc[date][item.status] || 0) + 1;
      return acc;
    }, {});
  }

  const dates = Object.keys(dailyData).slice(-7);
  const maxValue = Math.max(...dates.map(date => 
    dailyData[date].pending + dailyData[date].approved + dailyData[date].rejected
  ), 1);

  if (dates.length === 0) {
    return <div className="no-graph-data">No data available</div>;
  }

  return (
    <div className="bar-chart-container">
      {dates.map((date, index) => {
        const data = dailyData[date];
        const total = data.pending + data.approved + data.rejected;
        const pendingHeight = (data.pending / maxValue) * 100;
        const approvedHeight = (data.approved / maxValue) * 100;
        const rejectedHeight = (data.rejected / maxValue) * 100;

        return (
          <div key={index} className="bar-group">
            <div className="bar-stack">
              {data.approved > 0 && (
                <div 
                  className="bar-segment approved" 
                  style={{ height: `${approvedHeight}%` }}
                  title={`Approved: ${data.approved}`}
                ></div>
              )}
              {data.rejected > 0 && (
                <div 
                  className="bar-segment rejected" 
                  style={{ height: `${rejectedHeight}%` }}
                  title={`Rejected: ${data.rejected}`}
                ></div>
              )}
              {data.pending > 0 && (
                <div 
                  className="bar-segment pending" 
                  style={{ height: `${pendingHeight}%` }}
                  title={`Pending: ${data.pending}`}
                ></div>
              )}
            </div>
            <div className="bar-label">{date}</div>
          </div>
        );
      })}
    </div>
  );
};

export default BarGraph;
