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
          size: 4in 8.6in; /* Requested receipt size */
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
          width: 4in;
          height: 8.6in;
          padding: 1.8in 1in 0.4in 0.35in;
          margin: 0;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
        }
        
        /* Header Styles */
        .official-receipt-header {
          padding: 4px 16px 0 0;
          margin-bottom: 8px;
        }
        
        .receipt-top-bar {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .receipt-title-section {
          margin-bottom: 6px;
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
          gap: 6px;
          padding-top: 6px;
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
          border-top: none;
          padding: 6px 6px 28px 0;
          min-height: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          flex: 1;
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
          margin-bottom: 10px;
          padding-bottom: 6px;
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
          margin-bottom: 10px;
        }
        
        .fund-label {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 6px;
        }
        
        .fund-items-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .fund-item,
        .fund-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          font-size: 11px;
          border-bottom: 1px solid #f3f4f6;
        }

        .fund-item:last-child,
        .fund-item-row:last-child {
          border-bottom: none;
        }

        .fund-name {
          font-weight: 700;
          font-size: 11px;
          flex: 1;
          color: #000;
        }

        .fund-amount {
          font-weight: 700;
          font-size: 11px;
          color: #047857;
          margin-left: 8px;
        }
        
        .receipt-body-spacer {
          height: 8px;
          flex-shrink: 0;
        }
        
        .receipt-total-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin: 10px 0 6px 0;
          position: relative;
          z-index: 1;
        }
        
        .total-label-bold {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        
        .total-amount-bold {
          font-size: 17px;
          font-weight: 700;
          color: #000;
        }
        
        .amount-words-bold {
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0 10px 0;
          letter-spacing: 0.3px;
          position: relative;
          z-index: 1;
        }
        
        .receipt-description-box {
          margin: 8px 0;
          padding: 6px;
          background: #f9f9f9;
          position: relative;
          z-index: 1;
        }
        
        .description-label-receipt {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 3px;
        }

        .receipt-issued-by {
          margin-top: auto;
          text-align: right;
          align-self: flex-end;
          padding-top: 12px;
          padding-right: 6px;
        }

        .issued-by-label {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #6b7280;
          margin-bottom: 3px;
        }

        .issued-by-name {
          font-size: 11px;
          font-weight: 700;
          color: #111827;
        }

      </style>
    </head>
    <body>
  `;
};