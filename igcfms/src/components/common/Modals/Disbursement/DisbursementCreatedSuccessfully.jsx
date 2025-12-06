import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../css/Disbursement/DisbursementCreatedSuccessfully.css';

const CHEQUE_FIELD_LABELS = {
  dateIssued: "Date Issued",
  payeeName: "Payee Name",
  amountNumber: "Amount (Numeric)",
  amountWords: "Amount in Words"
};

const DEFAULT_CHEQUE_FIELD_POSITIONS = {
  dateIssued: { x: 420, y: 0 },
  payeeName: { x: 60, y: 36 },
  amountNumber: { x: 420, y: 76 },
  amountWords: { x: 60, y: 106 }
};

const CHEQUE_DATE_FORMATS = [
  { id: 'long', name: 'Month Day, Year', formatter: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  { id: 'numeric', name: 'MM/DD/YYYY', formatter: new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) },
  { id: 'iso', name: 'YYYY-MM-DD', formatter: new Intl.DateTimeFormat('en-CA') }
];

const cloneDefaultChequeLayout = () => JSON.parse(JSON.stringify(DEFAULT_CHEQUE_FIELD_POSITIONS));

const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    if (num === 0) return 'ZERO';
    const convertHundreds = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      if (n >= 20 && n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      if (n >= 100) {
        return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
      }
    };
    const convertThousands = (n) => {
      if (n < 1000) return convertHundreds(n);
      if (n < 1000000) {
        return convertHundreds(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '');
      }
      return convertHundreds(Math.floor(n / 1000000)) + ' MILLION' + (n % 1000000 !== 0 ? ' ' + convertThousands(n % 1000000) : '');
    };
    return convertThousands(Math.floor(num)).trim();
  };

const DisbursementCreatedSuccessfully = ({
  isOpen,
  onClose,
  disbursementResult,
}) => {
  const chequePreviewRef = useRef(null);
  const [chequePreviewPositions, setChequePreviewPositions] = useState(cloneDefaultChequeLayout());
  const [dragState, setDragState] = useState(null);
  const [chequeDateFormatIndex, setChequeDateFormatIndex] = useState(0);

  useEffect(() => {
    if (isOpen && disbursementResult?.modeOfPayment === "Cheque") {
      setChequePreviewPositions(cloneDefaultChequeLayout());
    } else if (!isOpen) {
      setDragState(null);
      setChequeDateFormatIndex(0);
    }
  }, [isOpen, disbursementResult?.modeOfPayment]);

  const selectedChequeDateFormatter = useMemo(() => (
    CHEQUE_DATE_FORMATS[chequeDateFormatIndex]?.formatter || new Intl.DateTimeFormat('en-US')
  ), [chequeDateFormatIndex]);

  const currentChequeDateFormatName = useMemo(() => (
    CHEQUE_DATE_FORMATS[chequeDateFormatIndex]?.name || 'Custom'
  ), [chequeDateFormatIndex]);

  const chequeFieldValues = useMemo(() => {
    if (!disbursementResult) {
      return {};
    }
    const amountNumeric = parseFloat(disbursementResult.amount || 0) || 0;
    const formattedAmount = `₱${amountNumeric.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    const issuedDate = disbursementResult.issuedAt
      ? new Date(disbursementResult.issuedAt)
      : new Date();
    return {
      dateIssued: selectedChequeDateFormatter.format(issuedDate),
      payeeName: disbursementResult.recipientName || '—',
      amountNumber: formattedAmount,
      amountWords: `${numberToWords(amountNumeric)} Pesos Only`
    };
  }, [disbursementResult, selectedChequeDateFormatter]);

  const handleCycleChequeDateFormat = () => {
    setChequeDateFormatIndex(prev => (prev + 1) % CHEQUE_DATE_FORMATS.length);
  };

  const handleStartDrag = (fieldKey, event) => {
    if (!chequePreviewRef.current) return;
    event.preventDefault();
    const containerRect = chequePreviewRef.current.getBoundingClientRect();
    const currentPosition = chequePreviewPositions[fieldKey] || { x: 0, y: 0 };
    const offsetX = event.clientX - (containerRect.left + currentPosition.x);
    const offsetY = event.clientY - (containerRect.top + currentPosition.y);
    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragState({ field: fieldKey, offsetX, offsetY });
  };

  const handleResetChequeLayout = () => {
    setChequePreviewPositions(cloneDefaultChequeLayout());
  };

  const sanitizeForHtml = (value) => (value || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const handlePrintChequeLayout = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return;
    const positionedFields = Object.keys(CHEQUE_FIELD_LABELS).map((key) => {
      const position = chequePreviewPositions[key] || { x: 0, y: 0 };
      const value = sanitizeForHtml(chequeFieldValues[key] || '');
      return `<div class="print-field print-field-${key}" style="left:${position.x}px;top:${position.y}px;">${value}</div>`;
    }).join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cheque Layout</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: 6.25in 2.75in; margin: 0; }
            html, body {
              width: 6.25in;
              height: 2.75in;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Inter', 'Segoe UI', sans-serif;
              background: #ffffff;
              margin: 0;
              padding: 0;
            }
            .cheque-doc {
              width: 6.25in;
              height: 2.75in;
              position: relative;
            }
            .print-field {
              position: absolute;
              font-size: 15px;
              color: #0f172a;
              font-weight: 600;
              white-space: nowrap;
            }
            .print-field-payeeName {
              white-space: nowrap;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="cheque-doc">${positionedFields}</div>
          <script>setTimeout(() => { window.print(); window.close(); }, 250);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!dragState?.field) {
      return undefined;
    }
    const handlePointerMove = (event) => {
      event.preventDefault();
      if (!chequePreviewRef.current) return;
      const rect = chequePreviewRef.current.getBoundingClientRect();
      const rawX = event.clientX - rect.left - (dragState.offsetX || 0);
      const rawY = event.clientY - rect.top - (dragState.offsetY || 0);
      const maxX = rect.width - 60;
      const maxY = rect.height - 30;
      const clampedX = Math.min(Math.max(rawX, 0), maxX);
      const clampedY = Math.min(Math.max(rawY, 0), maxY);
      setChequePreviewPositions(prev => ({
        ...prev,
        [dragState.field]: {
          x: Math.round(clampedX),
          y: Math.round(clampedY)
        }
      }));
    };
    const handlePointerUp = () => {
      setDragState(null);
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  if (!isOpen || !disbursementResult) return null;

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="success-modal-header">
          <i className="fas fa-check-circle success-icon"></i>
          <h3 className="success-modal-title">Disbursement Created</h3>
        </div>
        <div className="success-modal-body">
          <div className="success-details-grid">
            <div className="detail-item">
              <span className="detail-label">Transaction ID</span>
              <span className="detail-value">#{disbursementResult.transactionId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount</span>
              <span className="detail-value">₱{parseFloat(disbursementResult.amount).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Recipient</span>
              <span className="detail-value">{disbursementResult.recipientName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reference</span>
              <span className="detail-value">{disbursementResult.referenceNo}</span>
            </div>
          </div>
          {disbursementResult.modeOfPayment === "Cheque" && (
            <div className="cheque-preview-panel">
              <div className="cheque-preview-header">
                <div className="cheque-preview-header-actions">
                  <button type="button" className="cheque-preview-btn secondary" onClick={handleCycleChequeDateFormat}>
                    <i className="fas fa-calendar-alt"></i> Change Date Format
                    <span className="cheque-preview-format-label">{currentChequeDateFormatName}</span>
                  </button>
                  <button type="button" className="cheque-preview-btn ghost" onClick={handleResetChequeLayout}>
                    <i className="fas fa-undo"></i> Reset Layout
                  </button>
                  <button type="button" className="cheque-preview-btn outline" onClick={handlePrintChequeLayout}>
                    <i className="fas fa-print"></i> Print Layout
                  </button>
                </div>
              </div>
              <div className="cheque-preview-canvas" ref={chequePreviewRef}>
                <div className="cheque-preview-guides" aria-hidden="true" />
                {Object.keys(CHEQUE_FIELD_LABELS).map((key) => {
                  const position = chequePreviewPositions[key] || { x: 0, y: 0 };
                  return (
                    <div
                      key={key}
                      className={`cheque-preview-field cheque-field-${key}`}
                      style={{ left: position.x, top: position.y }}
                      onPointerDown={(event) => handleStartDrag(key, event)}
                    >
                      <span className="field-value">{chequeFieldValues[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="success-modal-footer">
          <button type="button" className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisbursementCreatedSuccessfully;
