/**
 * Invoice PDF Generator
 * Generates a professional invoice in a new window, ready for print/save-as-PDF.
 *
 * @param {Object} options
 * @param {Object} options.booking  - Booking data { txnid, trekName, phone, peopleCount, amount, status, createdAt }
 * @param {Object} options.company  - Company info { name, address, gst, website, logo, phone, email }
 */
export function generateInvoicePDF({ booking, company = {} }) {
  const companyName        = company.name             || company.companyName   || 'Your Company';
  const companyAddr        = company.address          || company.addressLine1  || '';
  const companyGst         = company.gst              || company.gstNumber     || '';
  const companyPan         = company.pan              || company.panNumber     || '';
  const companyRegNo       = company.regNo            || company.registrationNumber || '';
  const companyWeb         = company.website          || '';
  const companyLogo        = company.logo             || company.logoUrl       || '';
  const companyPhone       = company.phone            || '';
  const companyEmail       = company.email            || '';
  const pdfFooterText      = company.pdfFooterText    || `Thank you for booking with ${companyName}!`;
  const termsAndConditions = company.termsAndConditions || '';
  const cancellationPolicy = company.cancellationPolicy || '';

  const invoiceNo = booking.txnid || `INV-${Date.now()}`;
  const invoiceDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const pricePerPerson = booking.peopleCount > 0 ? Math.round(booking.amount / booking.peopleCount) : booking.amount;
  const subtotal = booking.amount || 0;

  const statusLabel = (booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1);
  const isPaid = (booking.status || '').toLowerCase() === 'paid';

  const logoBlock = companyLogo
    ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:60px;max-width:200px;object-fit:contain;" />`
    : `<div style="font-size:28px;font-weight:800;color:#1e293b;">${companyName}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; background: #fff; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .company-info h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 8px; }
    .company-info p { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h1 { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
    .invoice-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-top: 12px; }
    .invoice-meta .value { font-size: 14px; font-weight: 600; color: #334155; }

    /* Status */
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }

    /* Customer Info */
    .customer-section { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .customer-section .box { flex: 1; }
    .customer-section .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .customer-section .box p { font-size: 13px; color: #475569; line-height: 1.6; }
    .customer-section .box p strong { color: #1e293b; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #f8fafc; }
    thead th { padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; text-align: left; border-bottom: 2px solid #e2e8f0; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 14px 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    tbody td:last-child { text-align: right; font-weight: 600; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
    .totals-row.total { padding-top: 12px; margin-top: 8px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #0f172a; }

    /* Footer */
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer .thanks { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 8px; }

    /* Legal sections */
    .legal-section { margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .legal-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 700; margin-bottom: 10px; }
    .legal-section p { font-size: 12px; color: #475569; line-height: 1.8; white-space: pre-wrap; }

    /* Print */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice { padding: 20px; }
      .no-print { display: none !important; }
    }

    /* Print button */
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 12px; z-index: 100; }
    .print-bar button { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
    .print-bar .btn-print { background: #6366f1; color: #fff; }
    .print-bar .btn-print:hover { background: #4f46e5; }
    .print-bar .btn-close { background: #374151; color: #fff; }
    .print-bar .btn-close:hover { background: #4b5563; }
    .spacer { height: 56px; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="spacer no-print"></div>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        ${logoBlock}
        <h2>${companyName}</h2>
        ${companyAddr ? `<p>${companyAddr}</p>` : ''}
        ${companyGst ? `<p>GST: ${companyGst}</p>` : ''}
        ${companyWeb ? `<p>${companyWeb}</p>` : ''}
        ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
        ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
      </div>
      <div class="invoice-meta">
        <h1>INVOICE</h1>
        <div class="label">Invoice No</div>
        <div class="value">${invoiceNo}</div>
        <div class="label" style="margin-top:8px;">Date</div>
        <div class="value">${invoiceDate}</div>
        <div style="margin-top:12px;">
          <span class="status-badge status-${(booking.status || 'pending').toLowerCase()}">${statusLabel}</span>
        </div>
      </div>
    </div>

    <!-- Customer -->
    <div class="customer-section">
      <div class="box">
        <div class="box-title">Bill To</div>
        <p><strong>Phone:</strong> ${booking.phone || '—'}</p>
        <p><strong>Trek:</strong> ${booking.trekName || '—'}</p>
      </div>
      <div class="box" style="text-align:right;">
        <div class="box-title">Booking Details</div>
        <p><strong>Booking ID:</strong> ${booking._id || '—'}</p>
        <p><strong>Participants:</strong> ${booking.peopleCount || 0}</p>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${booking.trekName || 'Trek Booking'}</strong>
            <br /><span style="font-size:12px;color:#94a3b8;">Trek experience for ${booking.peopleCount || 1} person(s)</span>
          </td>
          <td>${booking.peopleCount || 1}</td>
          <td>₹${pricePerPerson.toLocaleString('en-IN')}</td>
          <td>₹${subtotal.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-row total">
          <span>Total Amount</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${isPaid
          ? `<div class="totals-row" style="color:#166534;font-weight:600;"><span>Amount Paid</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
             <div class="totals-row" style="font-weight:700;"><span>Balance Due</span><span>₹0</span></div>`
          : `<div class="totals-row" style="color:#92400e;font-weight:700;"><span>Balance Due</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>`
        }
      </div>
    </div>

    <!-- Terms & Conditions -->
    ${termsAndConditions ? `
    <div class="legal-section">
      <h4>Terms &amp; Conditions</h4>
      <p>${termsAndConditions.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>` : ''}

    <!-- Cancellation Policy -->
    ${cancellationPolicy ? `
    <div class="legal-section" style="margin-top:16px;">
      <h4>Cancellation Policy</h4>
      <p>${cancellationPolicy.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <p class="thanks">${pdfFooterText}</p>
      <p>This is a computer-generated invoice. For queries, contact us at ${companyPhone || companyEmail || companyWeb || companyName}.</p>
      <p style="margin-top:8px;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=850,height=1100');
  if (w) {
    w.document.write(html);
    w.document.close();
  } else {
    // Fallback: create downloadable HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
