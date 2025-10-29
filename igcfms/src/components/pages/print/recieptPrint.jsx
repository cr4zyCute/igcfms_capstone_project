export const getReceiptPrintHTML = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Official Receipt</title>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: 4.125in 9.5in; /* Envelope #10 size */
          margin: 0;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          background: white;
          color: #000;
          padding: 0;
          margin: 0;
          display: block;
          position: relative;
        }
        
        .receipt-print-area {
          width: 4.125in;
          height: 7in; 
          margin: 0;
          padding: 8px;
          padding-top: 8px;
          margin-top: 0;
          background: white;
          overflow: visible;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        /* Header Styles */
        .official-receipt-header {
          border: 2px solid #000;
          padding: 10px 8px;
          margin-bottom: 0;
        }
        
        .receipt-top-bar {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .receipt-title-section {
          margin-bottom: 10px;
        }
        
        .receipt-logos {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        
        .logo-image {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .receipt-title-content {
          flex: 1;
          text-align: center;
        }
        
        .receipt-title-content h1 {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        
        .system-name {
          font-size: 9px;
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .department-name {
          font-size: 8px;
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .contact-info {
          font-size: 7px;
          color: #555;
          line-height: 1.2;
        }
        
        .receipt-number-section {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #000;
          font-weight: bold;
        }
        
        .receipt-label {
          font-size: 11px;
        }
        
        .receipt-number {
          font-size: 13px;
          color: #000;
        }
        
        /* Body Styles */
        .official-receipt-body {
          border: 2px solid #000;
          border-top: none;
          padding: 15px 10px;
          min-height: auto;
          position: relative;
        }
        
        .receipt-center-logos {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
        }
        
        .center-logo-image {
          width: 180px;
          height: 180px;
          opacity: 0.06;
        }
        
        .receipt-payer-info {
          position: relative;
          z-index: 1;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .receipt-payer-info p {
          margin: 3px 0;
          font-size: 11px;
          font-weight: bold;
        }
        
        .receipt-fund-info {
          position: relative;
          z-index: 1;
          margin-bottom: 12px;
        }
        
        .fund-label {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 6px;
        }
        
        .fund-items-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px 10px;
          align-items: start;
        }

        .fund-item {
          display: contents;
        }

        .fund-name {
          font-weight: 700;
          font-size: 11px;
        }

        .fund-amount {
          font-weight: 700;
          font-size: 11px;
          color: #047857;
        }
        
        .receipt-body-spacer {
          height: 20px;
        }
        
        .receipt-total-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          margin: 12px 0 8px 0;
          position: relative;
          z-index: 1;
        }
        
        .total-label-bold {
          font-size: 14px;
          font-weight: bold;
        }
        
        .total-amount-bold {
          font-size: 20px;
          font-weight: bold;
          color: #000;
        }
        
        .amount-words-bold {
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0 12px 0;
          letter-spacing: 0.3px;
          position: relative;
          z-index: 1;
        }
        
        .receipt-description-box {
          margin: 10px 0;
          padding: 6px;
          border-left: 2px solid #000;
          background: #f9f9f9;
          position: relative;
          z-index: 1;
        }
        
        .description-label-receipt {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .description-text-receipt {
          font-size: 10px;
          color: #333;
        }
        
        .payment-checkboxes {
          display: flex;
          gap: 20px;
          margin: 12px 0;
          position: relative;
          z-index: 1;
        }
        
        .payment-checkboxes label {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
        }
        
        .payment-checkboxes input[type="checkbox"] {
          width: 10px;
          height: 10px;
        }
        
        .receipt-acknowledgment-line {
          font-size: 10px;
          margin: 12px 0 8px 0;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        
        .signature-area {
          margin-top: 25px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        
        .signature-line-bottom {
          width: 200px;
          border-bottom: 1px solid #000;
          margin: 0 auto 3px auto;
        }
        
        .signature-text {
          font-size: 10px;
          font-style: italic;
        }
        
        @media print {
          @page {
            size: 4.125in 9.5in; /* Envelope #10 size */
            margin: 0;
          }
          
          body {
            padding: 0;
            margin: 0;
            display: block;
            position: relative;
          }
          
          .receipt-print-area {
            width: 4.125in;
            height: 7in; /* Receipt content is 7 inches on 9.5 inch paper */
            padding: 8px;
            padding-top: 8px;
            margin: 0;
            margin-top: 0;
            overflow: visible;
            position: absolute;
            top: 0;
            left: 0;
          }
        }
      </style>
    </head>
    <body>
  `;
};