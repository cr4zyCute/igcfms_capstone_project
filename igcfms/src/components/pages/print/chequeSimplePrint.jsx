export const getCompleteChequeHTML = (chequeData) => {
  const {
    date = '',
    payeeName = '',
    amount = '',
    amountInWords = '',
    accountNumber = '123123123312',
    routingNumber = 'CHQ-20251019-4837'
  } = chequeData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 6.25in 2.75in landscape; margin: 0; }
        html, body { width: 6.25in; height: 2.75in; margin: 0; padding: 0; overflow: hidden; }
        body { font-family: Arial, sans-serif; background: white; color: #000; }
        .date-section { position: absolute; top: 50px; right: 105px; }
        .date-label { font-size: 9pt; color: #000000; }
        .date-value { font-size: 9pt; color: #000000; }
        .payto-section { position: absolute; top: 0.5in; left: 0.1in; }
        .payto-name { font-size: 12pt; font-weight: bold; text-transform: uppercase; color:rgb(0, 0, 0); position: absolute; top: 37px;left: 96px; }
        .amount-words-section { position: absolute; top: 130px; left: 96px; }
        .amount-words-text { font-size: 11pt; color: #000000; }
        .amount-number-section { position: absolute; top: 89px;left: 460px; }
        .amount-number-text { font-size: 12pt; font-weight: bold; color: #000000; }
        .micr-section { position: absolute; bottom: 0.1in; left: 0.1in; }
        .micr-text { font-family: 'Courier New', monospace; font-size: 9pt; color: #333; letter-spacing: 2px; }
        @media print {
          @page { size: 6.25in 2.75in landscape; margin: 0; }6
          html, body { width: 6.25in; height: 2.75in; margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="cheque-container">
        <div class="date-section"><span class="date-label"></span><span class="date-value">${date}</span></div>
        <div class="payto-section"><span class="payto-name">${payeeName}</span></div>
        <div class="amount-number-section"><span class="amount-number-text">${amount}</span></div>
        <div class="amount-words-section"><span class="amount-words-text">${amountInWords}</span></div>
      </div>
    </body>
    </html>
  `;
};
export const printCompleteCheque = (chequeData) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(getCompleteChequeHTML(chequeData));
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  }
};
