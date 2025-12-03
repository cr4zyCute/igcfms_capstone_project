import React from 'react';

const CollectionReportTab = ({ 
  selectedReportType, 
  groupedCollectionsByReceipt 
}) => {
  return (
    <div className="gr-table-section">
      <div className="gr-table-container">
        <table className="gr-table">
          <thead>
            <tr>
              {selectedReportType === 'collection-or-fee-details' ? (
                <>
                  <th><i className="fas fa-code"></i> FUNDS ACCOUNT CODE</th>
                  <th><i className="fas fa-wallet"></i> FUNDS ACCOUNT NAME</th>
                  <th><i className="fas fa-hashtag"></i> O.R #</th>
                  <th><i className="fas fa-money-bill"></i> AMOUNT PAID</th>
                </>
              ) : selectedReportType === 'collection-or-fee-summary' ? (
                <>
                  <th><i className="fas fa-code"></i> FUNDS ACCOUNT CODE</th>
                  <th><i className="fas fa-wallet"></i> FUNDS ACCOUNT NAME</th>
                  <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                </>
              ) : selectedReportType === 'collection-or-details' ? (
                <>
                  <th><i className="fas fa-receipt"></i> O.R NUMBER</th>
                  <th><i className="fas fa-id-card"></i> PAYEE ID</th>
                  <th><i className="fas fa-user"></i> PAYEE</th>
                  <th style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><i className="fas fa-wallet"></i> FUNDS ACCOUNTS</span>
                    <span style={{ color: '#ffffff', fontWeight: '700', marginLeft: '20px' }}>AMOUNT PAID</span>
                  </th>
                </>
              ) : (
                <>
                  <th><i className="fas fa-receipt"></i> O.R NUMBER</th>
                  <th><i className="fas fa-id-card"></i> PAYEE ID</th>
                  <th><i className="fas fa-user"></i> PAYEE</th>
                  <th><i className="fas fa-money-bill"></i> TOTAL AMOUNT</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {groupedCollectionsByReceipt.length > 0 ? (
              selectedReportType === 'collection-or-fee-details' ? (
                (() => {
                  // Group items by fund account
                  const groupedByFund = {};
                  groupedCollectionsByReceipt.forEach((collection) => {
                    if (collection.items && Array.isArray(collection.items)) {
                      collection.items.forEach((item) => {
                        const fundKey = item.fund_account?.code || 'N/A';
                        if (!groupedByFund[fundKey]) {
                          groupedByFund[fundKey] = {
                            code: item.fund_account?.code || 'N/A',
                            name: item.fund_account?.name || item.fundAccountName || 'N/A',
                            collections: []
                          };
                        }
                        groupedByFund[fundKey].collections.push({
                          receipt_no: collection.receipt_no,
                          amount: item.amount
                        });
                      });
                    }
                  });

                  // Render grouped data
                  return Object.values(groupedByFund).flatMap((fund, fundIdx) => {
                    const totalAmount = fund.collections.reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
                    return [
                      ...fund.collections.map((col, colIdx) => (
                        <tr key={`${fund.code}-${colIdx}`} className="table-row">
                          <td>
                            <span className="fund-code">{colIdx === 0 ? fund.code : ''}</span>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className="fund-name">{colIdx === 0 ? fund.name : ''}</span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className="or-number">{col.receipt_no || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className="amount amount-positive">
                                ₱{parseFloat(col.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )),
                      <tr key={`${fund.code}-total`} className="table-row" style={{ fontWeight: '700', borderTop: '1px solid #999' }}>
                        <td>
                          <div className="gr-cell-content"></div>
                        </td>
                        <td>
                          <div className="gr-cell-content"></div>
                        </td>
                        <td style={{ textAlign: 'left', paddingLeft: '12px' }}>
                          <span style={{ fontWeight: '700' }}>Total:</span>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="amount amount-positive">
                              ₱{totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ];
                  });
                })()
              ) : selectedReportType === 'collection-or-fee-summary' ? (
                groupedCollectionsByReceipt.flatMap((collection, idx) => (
                  collection.items && Array.isArray(collection.items) && collection.items.length > 0 ? (
                    collection.items.map((item, itemIdx) => (
                      <tr key={`${collection.receipt_no}-${itemIdx}`} className="table-row">
                        <td>
                          <div className="gr-cell-content">
                            <span className="fund-code">{item.fund_account?.code || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="fund-name">{item.fund_account?.name || item.fundAccountName || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="amount amount-positive">
                              ₱{parseFloat(item.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    [
                      <tr key={`${collection.receipt_no}-${idx}`} className="table-row">
                        <td colSpan="3" className="gr-no-data">
                          <div className="gr-no-data-content">
                            <i className="fas fa-inbox"></i>
                            <p>No items found.</p>
                          </div>
                        </td>
                      </tr>
                    ]
                  )
                ))
              ) : (
                groupedCollectionsByReceipt.map((collection, idx) => (
                  <tr key={`${collection.receipt_no}-${idx}`} className="table-row">
                    {selectedReportType === 'collection-or-details' ? (
                      <>
                        <td>
                          <div className="gr-cell-content">
                            <span className="or-number">{collection.receipt_no || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="payee-id">{collection.payee_id || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="payee-name">{collection.recipient || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            {collection.items && Array.isArray(collection.items) && collection.items.length > 0 ? (
                              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {collection.items.map((item, itemIdx) => (
                                    <tr key={itemIdx}>
                                      <td style={{ paddingRight: '12px', textAlign: 'left', paddingBottom: '2px' }}>
                                        {item.fund_account?.name || item.fundAccountName || item.fund_account?.code || 'N/A'}
                                      </td>
                                      <td style={{ textAlign: 'right', paddingBottom: '2px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        ₱{parseFloat(item.amount || 0).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr style={{ borderTop: '1px solid #999', fontWeight: '700' }}>
                                    <td style={{ paddingRight: '12px', textAlign: 'left', paddingTop: '4px' }}>TOTAL</td>
                                    <td style={{ textAlign: 'right', paddingTop: '4px', whiteSpace: 'nowrap' }}>
                                      ₱{parseFloat(collection.totalAmount || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            ) : (
                              <span className="funds-accounts">N/A</span>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div className="gr-cell-content">
                            <span className="or-number">{collection.receipt_no || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="payee-id">{collection.payee_id || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="payee-name">{collection.recipient || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="amount amount-positive">
                              ₱{parseFloat(collection.totalAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={selectedReportType === 'collection-or-fee-details' ? 6 : selectedReportType === 'collection-or-fee-summary' ? 3 : selectedReportType === 'collection-or-details' ? 4 : 4} className="gr-no-data">
                  <div className="gr-no-data-content">
                    <i className="fas fa-inbox"></i>
                    <p>No collection records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectionReportTab;
