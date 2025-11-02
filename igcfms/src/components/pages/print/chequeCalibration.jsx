// Calibration template to test alignment with pre-printed cheque
export const getChequeCalibrationHTML = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cheque Alignment Calibration</title>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: 5in 3in;
          margin: 0;
        }
        
        body {
          font-family: Arial, sans-serif;
          background: white;
          margin: 0;
          padding: 0;
        }
        
        .calibration-container {
          width: 5in;
          height: 3in;
          position: relative;
          background: white;
          border: 1px dashed #ccc;
        }
        
        /* Ruler marks */
        .ruler-horizontal {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 0.1in;
          background: repeating-linear-gradient(
            to right,
            #000 0,
            #000 1px,
            transparent 1px,
            transparent 0.1in
          );
        }
        
        .ruler-vertical {
          position: absolute;
          top: 0;
          left: 0;
          width: 0.1in;
          height: 100%;
          background: repeating-linear-gradient(
            to bottom,
            #000 0,
            #000 1px,
            transparent 1px,
            transparent 0.1in
          );
        }
        
        /* Measurement labels */
        .measurements {
          position: absolute;
          top: 0.05in;
          left: 0.05in;
          font-size: 8pt;
          color: #666;
        }
        
        /* Test markers at key positions */
        .marker {
          position: absolute;
          background: rgba(255, 0, 0, 0.3);
          border: 1px solid red;
          font-size: 7pt;
          padding: 2px;
          color: red;
        }
        
        .marker-logo {
          top: 0.15in;
          left: 0.15in;
          width: 0.6in;
          height: 0.6in;
        }
        
        .marker-number {
          top: 0.15in;
          right: 0.15in;
          padding: 3px 5px;
        }
        
        .marker-date {
          top: 0.45in;
          right: 0.4in;
          padding: 3px 5px;
        }
        
        .marker-payee {
          top: 0.85in;
          left: 0.8in;
          width: 3in;
          height: 0.15in;
        }
        
        .marker-amount {
          top: 0.75in;
          right: 0.25in;
          padding: 3px 8px;
        }
        
        .marker-words {
          top: 1.35in;
          left: 0.15in;
          right: 0.8in;
          height: 0.15in;
        }
        
        .marker-memo {
          top: 2.0in;
          left: 0.35in;
          width: 2.5in;
          height: 0.15in;
        }
        
        .marker-micr {
          bottom: 0.15in;
          left: 50%;
          transform: translateX(-50%);
          padding: 3px 10px;
        }
        
        /* Grid overlay */
        .grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            repeating-linear-gradient(0deg, transparent, transparent 0.09in, rgba(0,0,0,0.1) 0.09in, rgba(0,0,0,0.1) 0.1in),
            repeating-linear-gradient(90deg, transparent, transparent 0.09in, rgba(0,0,0,0.1) 0.09in, rgba(0,0,0,0.1) 0.1in);
          pointer-events: none;
        }
        
        .instructions {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px;
          border: 2px solid #000;
          font-size: 9pt;
        }
        
        @media print {
          .calibration-container {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="calibration-container">
        <!-- Rulers -->
        <div class="ruler-horizontal"></div>
        <div class="ruler-vertical"></div>
        
        <!-- Grid -->
        <div class="grid"></div>
        
        <!-- Measurement labels -->
        <div class="measurements">
          5" × 3" (Width × Height)
        </div>
        
        <!-- Test markers -->
        <div class="marker marker-logo">LOGO<br>0.15" from<br>top-left</div>
        <div class="marker marker-number">NUMBER<br>0.15" from top-right</div>
        <div class="marker marker-date">DATE<br>0.45" from top</div>
        <div class="marker marker-payee">PAYEE NAME - 0.85" from top</div>
        <div class="marker marker-amount">AMOUNT<br>0.75" from top</div>
        <div class="marker marker-words">AMOUNT IN WORDS - 1.35" from top</div>
        <div class="marker marker-memo">MEMO - 2.0" from top</div>
        <div class="marker marker-micr">MICR LINE - 0.15" from bottom</div>
        
        <!-- Instructions -->
        <div class="instructions">
          <strong>CALIBRATION TEST SHEET</strong><br>
          <small>
            1. Print this page<br>
            2. Overlay on your pre-printed cheque<br>
            3. Check if red markers align with printed fields<br>
            4. Adjust CSS values if needed
          </small>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to open calibration test
export const printCalibration = () => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(getChequeCalibrationHTML());
    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};
