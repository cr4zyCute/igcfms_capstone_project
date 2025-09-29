
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to format currency
const formatCurrency = (amount) => {
  const formattedAmount = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `P ${formattedAmount}`;
};

// Export Fund Accounts to PDF with professional header and table
export const exportFundAccountsPDF = (accounts) => {
  const currentDate = new Date();
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
  
  // Create new PDF document
  const doc = new jsPDF('landscape', 'pt', 'a4');
  
  // Set document properties
  doc.setProperties({
    title: 'IGCFMS - Fund Accounts Report',
    subject: 'Fund Accounts Report',
    author: 'IGCFMS',
    creator: 'IGCFMS System'
  });
  
  // Header Section
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // System Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('IGCFMS – Fund Accounts Report', margin, 50);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Integrated Government Cash Flow Management System', margin, 70);
  
  // Report metadata - right aligned
  const metaStartX = pageWidth - margin;
  doc.setFontSize(10);
  doc.text(`Generated: ${currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, metaStartX, 50, { align: 'right' });
  
  doc.text(`Total Accounts: ${accounts.length}`, metaStartX, 65, { align: 'right' });
  doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, metaStartX, 80, { align: 'right' });
  
  // Draw header line
  doc.setLineWidth(2);
  doc.line(margin, 90, pageWidth - margin, 90);
  
  // Prepare table data
  const tableColumns = [
    'Account Code',
    'Account Name', 
    'Type',
    'Balance',
    'Transactions Count'
  ];
  
  const tableRows = accounts.map(account => [
    account.code || 'N/A',
    account.name || 'N/A',
    account.account_type || 'N/A',
    formatCurrency(account.current_balance),
    (account.transactionCount || 0).toString()
  ]);
  
  // Generate table with autoTable
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 110,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' }, // Account Code
      1: { halign: 'left' }, // Account Name
      2: { halign: 'center' }, // Type
      3: { halign: 'right', fontStyle: 'bold' }, // Balance
      4: { halign: 'center' } // Transactions Count
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.5,
    didParseCell: function(data) {
      // Style balance column
      if (data.column.index === 3) {
        data.cell.styles.textColor = [0, 0, 0];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Footer
  const finalY = doc.lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This report is computer-generated and contains confidential financial information.', 
    pageWidth / 2, finalY + 30, { align: 'center' });
  doc.text(`Generated on ${currentDate.toLocaleString()} | IGCFMS System`, 
    pageWidth / 2, finalY + 45, { align: 'center' });
  
  // Save the PDF
  const fileName = `fund-accounts-report-${currentDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export Transaction History to PDF with professional header and table
export const exportTransactionHistoryPDF = (data, accountName) => {
  const currentDate = new Date();
  const totalAmount = data.reduce((sum, tx) => {
    const amount = Math.abs(tx.amount || 0);
    return sum + amount;
  }, 0);
  
  // Create new PDF document
  const doc = new jsPDF('landscape', 'pt', 'a4');
  
  // Set document properties
  doc.setProperties({
    title: `IGCFMS - Transaction History - ${accountName}`,
    subject: 'Transaction History Report',
    author: 'IGCFMS',
    creator: 'IGCFMS System'
  });
  
  // Header Section
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // System Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('IGCFMS – Transaction History Report', margin, 50);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Integrated Government Cash Flow Management System', margin, 70);
  
  // Account name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Account: ${accountName}`, margin, 90);
  
  // Report metadata - right aligned
  const metaStartX = pageWidth - margin;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, metaStartX, 50, { align: 'right' });
  
  doc.text(`Total Transactions: ${data.length}`, metaStartX, 65, { align: 'right' });
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, metaStartX, 80, { align: 'right' });
  
  // Draw header line
  doc.setLineWidth(2);
  doc.line(margin, 100, pageWidth - margin, 100);
  
  // Prepare table data
  const tableColumns = [
    'Date',
    'Description',
    'Payee/Payer',
    'Type',
    'Amount',
    'Reference'
  ];
  
  const tableRows = data.map(transaction => [
    new Date(transaction.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    transaction.description || 'N/A',
    transaction.type === 'Collection'
      ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
      : (transaction.recipient || transaction.payer_name || 'Unknown Payee'),
    transaction.type || 'N/A',
    `${transaction.type === 'Collection' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount || 0))}`,
    transaction.reference || transaction.reference_no || transaction.receipt_no || 'N/A'
  ]);
  
  // Generate table with autoTable
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 120,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center' }, // Date
      1: { halign: 'left' }, // Description
      2: { halign: 'left' }, // Payee/Payer
      3: { halign: 'center' }, // Type
      4: { halign: 'right', fontStyle: 'bold' }, // Amount
      5: { halign: 'center' } // Reference
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.5,
    didParseCell: function(data) {
      // Style type column
      if (data.column.index === 3) {
        if (data.cell.text[0] === 'Collection') {
          data.cell.styles.textColor = [0, 100, 0];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [150, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      
      // Style amount column
      if (data.column.index === 4) {
        if (data.cell.text[0].startsWith('+')) {
          data.cell.styles.textColor = [0, 100, 0];
        } else {
          data.cell.styles.textColor = [150, 0, 0];
        }
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Footer
  const finalY = doc.lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This report is computer-generated and contains confidential financial information.', 
    pageWidth / 2, finalY + 30, { align: 'center' });
  doc.text(`Generated on ${currentDate.toLocaleString()} | Account: ${accountName}`, 
    pageWidth / 2, finalY + 45, { align: 'center' });
  
  // Save the PDF
  const fileName = `transaction-history-${accountName.replace(/[^a-z0-9]/gi, '_')}-${currentDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
