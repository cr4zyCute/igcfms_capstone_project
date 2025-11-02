// Simplified cheque print template - left side only
export const getCompleteChequeHTML = (chequeData) => {
  const {
    chequeNumber = '',
    date = '',
    payeeName = '',
    amount = 0,
    amountInWords = '',
    memo = '',
    accountNumber = '123123123312',
    routingNumber = 'CHQ-20251019-4837'
  } = chequeData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cheque Print - ${chequeNumber}</title>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: 6.25in 2.75in landscape;
          margin: 0;
        }
        
        html, body {
          width: 6.25in;
          height: 2.75in;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        body {
          font-family: Arial, sans-serif;
          background: white;
          color: #000;
        }
        
        .cheque-container {
          width: 6.25in;
          height: 2.75in;
          position: relative;
          background: white;
          padding: 0.15in;
        }
        
        /* Date Section - Top Right */
        .date-section {
          position: absolute;
          top: 0.1in;
          right: 0.1in;
          display: flex;
          align-items: center;
        }
        
        .date-label {
          font-size: 9pt;
          color: #666;
        }
        
        .payto-name {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
          margin-left: 10%;
        }
        
        .amount-words-text {
          font-size: 11pt;
          color: #000;
        }
        
        .micr-text {
          font-family: 'Courier New', monospace;
          color: #333;
          letter-spacing: 2px;
        }
    </html>
  `;
};

// Helper function to open print window
const printCheque = (chequeData) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(getCompleteChequeHTML(chequeData));
    printWindow.document.close();
    
    // Wait for content and images to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  }
};
