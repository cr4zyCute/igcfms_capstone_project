
const getReportStyles = () => `
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #fff;
      color: #333;
      line-height: 1.4;
    }
    
    /* Header Styles */
    .report-header {
      border-bottom: 3px solid #000000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo-placeholder {
      width: 60px;
      height: 60px;
      background: #000000;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .org-info h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #000000;
      letter-spacing: -0.5px;
    }
    
    .org-info h2 {
      margin: 2px 0 5px 0;
      font-size: 14px;
      font-weight: 400;
      color: #333333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .org-info p {
      margin: 2px 0;
      font-size: 12px;
      color: #333333;
    }
    
    .report-info {
      text-align: right;
    }
    
    .report-title {
      font-size: 24px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 8px 0;
    }
    
    .report-meta {
      font-size: 12px;
      color: #333333;
    }
    
    .report-meta div {
      margin: 2px 0;
    }
    
    /* Table Styles */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .data-table th {
      background: #000000;
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #000000;
    }
    
    .data-table td {
      padding: 10px;
      border-bottom: 1px solid #cccccc;
      border-left: 1px solid #cccccc;
      border-right: 1px solid #cccccc;
      font-size: 13px;
      vertical-align: top;
    }
    
    .data-table tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    
    .data-table tr:hover {
      background-color: #eeeeee;
    }
    
    /* Amount styling */
    .amount {
      text-align: right;
      font-weight: 600;
    }
    
    .collection {
      color: #000000;
      font-weight: 700;
    }
    
    .disbursement {
      color: #666666;
      font-weight: 700;
    }
    
    /* Status badges */
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #cccccc;
    }
    
    .status-active {
      background: #ffffff;
      color: #000000;
      border: 1px solid #000000;
    }
    
    .status-inactive {
      background: #f5f5f5;
      color: #666666;
      border: 1px solid #666666;
    }
    
    /* Footer */
    .report-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #cccccc;
      text-align: center;
      font-size: 11px;
      color: #333333;
    }
    
    /* Print optimizations */
    @media print {
      body { margin: 0; padding: 15px; }
      .report-header { page-break-after: avoid; }
      .data-table { page-break-inside: avoid; }
      .data-table tr { page-break-inside: avoid; }
    }
  </style>
`;

// Export Fund Accounts to PDF with professional header
export const exportFundAccountsPDF = (accounts) => {
  const currentDate = new Date();
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
  
  const printContent = `
    <html>
      <head>
        <title>Fund Accounts Report - IGCFMS</title>
        ${getReportStyles()}
      </head>
      <body>
        <!-- Professional Header -->
        <div class="report-header">
          <div class="header-top">
            <div class="logo-section">
              <div class="logo-placeholder">
                🏛️
              </div>
              <div class="org-info">
                <h1>IGCFMS</h1>
                <h2>Integrated Government Cash Flow Management System</h2>
                <p>Government Financial Services Department</p>
                <p>Tel: (02) 8888-0000 | Email: igcfms@gmail.com</p>
              </div>
            </div>
            <div class="report-info">
              <div class="report-title">Fund Accounts Report</div>
              <div class="report-meta">
                <div><strong>Generated:</strong> ${currentDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div><strong>Total Accounts:</strong> ${accounts.length}</div>
                <div><strong>Total Balance:</strong> ₱${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fund Accounts Table -->
        <table class="data-table">
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Current Balance</th>
              <th>Transactions</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${accounts
              .map(account => `
                <tr>
                  <td><strong>${account.code || 'N/A'}</strong></td>
                  <td>${account.name || 'N/A'}</td>
                  <td>${account.account_type || 'N/A'}</td>
                  <td class="amount">₱${(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center;">${account.transactionCount || 0}</td>
                  <td>
                    <span class="status-badge ${account.is_active !== false ? 'status-active' : 'status-inactive'}">
                      ${account.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>${new Date(account.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>

        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>IGCFMS - Fund Accounts Report</strong></p>
          <p>This report is computer-generated and contains confidential financial information.</p>
          <p>Generated on ${currentDate.toLocaleString()} | Page 1 of 1</p>
        </div>
      </body>
    </html>
  `;

  // Create a canvas to generate PDF content
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 595; // A4 width in points
  canvas.height = 842; // A4 height in points
  
  // Set white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  
  // Draw header
  ctx.fillText('IGCFMS - Fund Accounts Report', canvas.width / 2, 40);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Generated: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`, canvas.width / 2, 60);
  ctx.fillText(`Total Accounts: ${accounts.length} | Total Balance: ₱${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, canvas.width / 2, 80);
  
  // Draw line under header
  ctx.beginPath();
  ctx.moveTo(50, 90);
  ctx.lineTo(canvas.width - 50, 90);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Convert canvas to blob and create PDF
  canvas.toBlob((blob) => {
    // Create a simple PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 16 Tf
306 750 Td
(IGCFMS - Fund Accounts Report) Tj
0 -20 Td
/F1 12 Tf
(Generated: ${currentDate.toLocaleDateString()}) Tj
0 -20 Td
(Total Accounts: ${accounts.length} | Total Balance: ₱${totalBalance.toLocaleString()}) Tj
0 -40 Td
(Account Code | Account Name | Type | Balance | Transactions | Status) Tj
${accounts.slice(0, 20).map((account, index) => `
0 -20 Td
(${account.code || 'N/A'} | ${(account.name || 'N/A').substring(0, 15)} | ${account.account_type || 'N/A'} | ₱${(account.current_balance || 0).toFixed(2)} | ${account.transactionCount || 0} | ${account.is_active !== false ? 'Active' : 'Inactive'}) Tj`).join('')}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000900 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
999
%%EOF`;

    // Create real PDF blob and download
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IGCFMS Disbursement Report ${currentDate.toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

// Export Transaction History to PDF with professional header
export const exportTransactionHistoryPDF = (data, accountName) => {
  const currentDate = new Date();
  const totalAmount = data.reduce((sum, tx) => {
    const amount = Math.abs(tx.amount || 0);
    return sum + amount;
  }, 0);
  
  const printContent = `
    <html>
      <head>
        <title>Transaction History - ${accountName}</title>
        ${getReportStyles()}
      </head>
      <body>
        <!-- Professional Header -->
        <div class="report-header">
          <div class="header-top">
            <div class="logo-section">
              <div class="logo-placeholder">
                🏛️
              </div>
              <div class="org-info">
                <h1>IGCFMS</h1>
                <h2>Integrated Government Cash Flow Management System</h2>
                <p>Government Financial Services Department</p>
                <p>Tel: (02) 8888-0000 | Email: igcfms@gmail.com</p>
              </div>
            </div>
            <div class="report-info">
              <div class="report-title">Transaction History</div>
              <div class="report-meta">
                <div><strong>Account:</strong> ${accountName}</div>
                <div><strong>Generated:</strong> ${currentDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div><strong>Total Transactions:</strong> ${data.length}</div>
                <div><strong>Total Amount:</strong> ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Payee/Payer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(transaction => `
                <tr>
                  <td>${new Date(transaction.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                  <td>${transaction.description || 'N/A'}</td>
                  <td>${
                    transaction.type === 'Collection'
                      ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
                      : (transaction.recipient || transaction.payer_name || 'Unknown Payee')
                  }</td>
                  <td>
                    <span class="status-badge ${transaction.type?.toLowerCase() === 'collection' ? 'status-active' : 'status-inactive'}">
                      ${transaction.type || 'N/A'}
                    </span>
                  </td>
                  <td class="amount ${transaction.type?.toLowerCase()}">${
                    transaction.type === 'Collection' ? '+' : '-'
                  }₱${Math.abs(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>${transaction.reference || transaction.reference_no || transaction.receipt_no || 'N/A'}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>

        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>IGCFMS - Transaction History Report</strong></p>
          <p>This report is computer-generated and contains confidential financial information.</p>
          <p>Generated on ${currentDate.toLocaleString()} | Account: ${accountName}</p>
        </div>
      </body>
    </html>
  `;

  // Create a simple PDF structure for transaction history
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 600
>>
stream
BT
/F1 16 Tf
306 750 Td
(IGCFMS - Transaction History Report) Tj
0 -20 Td
/F1 12 Tf
(Account: ${accountName}) Tj
0 -20 Td
(Generated: ${currentDate.toLocaleDateString()}) Tj
0 -20 Td
(Total Transactions: ${data.length} | Total Amount: ₱${totalAmount.toLocaleString()}) Tj
0 -40 Td
(Date | Description | Type | Amount | Payer | Recipient | Status) Tj
${data.slice(0, 15).map((tx, index) => `
0 -20 Td
(${new Date(tx.created_at).toLocaleDateString()} | ${(tx.description || 'N/A').substring(0, 10)} | ${tx.type || 'N/A'} | ₱${Math.abs(tx.amount || 0).toFixed(2)} | ${(tx.payer_name || 'N/A').substring(0, 8)} | ${(tx.recipient || 'N/A').substring(0, 8)} | ${tx.status || 'N/A'}) Tj`).join('')}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000001000 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1099
%%EOF`;

  // Create real PDF blob and download
  const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `IGCFMS Disbursement Report ${accountName.replace(/[^a-z0-9]/gi, '_')} ${currentDate.toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
