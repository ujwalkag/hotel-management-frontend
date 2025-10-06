export default async function printDetailedBill(session, tableNumber, orders, isCompact = true) {
  try {
    const now = new Date();
    const billDate = now.toLocaleDateString("en-IN");
    const billTime = now.toLocaleTimeString("en-IN");

    const subtotal = orders.reduce(
      (sum, order) => sum + parseFloat(order.total_price || 0),
      0
    );
    const discountAmount = parseFloat(session.discount_amount || 0);
    const serviceCharge = parseFloat(session.service_charge || 0);
    const taxableAmount = subtotal - discountAmount;

    const gstRate = 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const finalTotal = taxableAmount + gstAmount + serviceCharge;

    const containerWidth = isCompact ? "280px" : "380px";
    const fontSize = isCompact ? "11px" : "14px";

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - ${session.receipt_number || 'BILL'}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 10px;
            font-size: ${fontSize};
            line-height: 1.4;
            color: #000;
          }
          .bill-container {
            max-width: ${containerWidth};
            margin: 0 auto;
            border: 1px solid #000;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .hotel-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .bill-title {
            font-size: ${isCompact ? '13px' : '15px'};
            font-weight: bold;
            margin: 10px 0;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 10px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .item-row {
            margin: 5px 0;
            padding: 3px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            font-size: 11px;
            color: #666;
            margin-left: 10px;
          }
          .total-section {
            border-top: 1px solid #000;
            margin-top: 10px;
            padding-top: 10px;
          }
          .grand-total {
            font-size: ${isCompact ? '14px' : '16px'};
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 5px 0;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 11px;
          }
          .gst-section {
            background: #f9f9f9;
            padding: 5px;
            margin: 5px 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .bill-container { border: none; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="hotel-name">HOTEL RESTAURANT</div>
            <div>Complete Dining Experience</div>
            <div style="font-size: 10px; margin-top: 5px;">
              GSTIN: 27ABCDE1234F1Z5 | FSSAI: 12345678901234
            </div>
          </div>
          <div class="bill-title">TAX INVOICE</div>
          <div class="row"><span>Receipt #:</span><span><strong>${session.receipt_number || 'N/A'}</strong></span></div>
          <div class="row"><span>Table:</span><span><strong>${tableNumber}</strong></span></div>
          <div class="row"><span>Date:</span><span>${billDate}</span></div>
          <div class="row"><span>Time:</span><span>${billTime}</span></div>
          <div class="divider"></div>
          <div><strong>Customer Details:</strong></div>
          <div class="row"><span>Name:</span><span>${session.customer_name || 'Guest'}</span></div>
          ${session.customer_phone ? `<div class="row"><span>Phone:</span><span>${session.customer_phone}</span></div>` : ''}
          <div class="divider"></div>
          <div><strong>Order Details:</strong></div>
          ${orders.map(order => `
            <div class="item-row">
              <div class="item-name">${order.menu_item_name}</div>
              <div class="item-details">
                ${order.quantity} x ₹${parseFloat(order.unit_price || 0).toFixed(2)} = ₹${parseFloat(order.total_price || 0).toFixed(2)}
              </div>
              ${order.special_instructions ? `<div class="item-details" style="font-style: italic;">Note: ${order.special_instructions}</div>` : ''}
            </div>
          `).join('')}
          <div class="total-section">
            <div class="row"><span>Subtotal (${orders.length} items):</span><span>₹${subtotal.toFixed(2)}</span></div>
            ${discountAmount > 0 ? `<div class="row"><span>Discount:</span><span>-₹${discountAmount.toFixed(2)}</span></div>` : ''}
            <div class="row"><span>Taxable Amount:</span><span>₹${taxableAmount.toFixed(2)}</span></div>
            <div class="gst-section">
              <div><strong>GST Breakdown (${gstRate}%):</strong></div>
              <div class="row"><span>CGST (${gstRate / 2}%):</span><span>₹${cgstAmount.toFixed(2)}</span></div>
              <div class="row"><span>SGST (${gstRate / 2}%):</span><span>₹${sgstAmount.toFixed(2)}</span></div>
              <div class="row"><span>Total GST:</span><span>₹${gstAmount.toFixed(2)}</span></div>
            </div>
            ${serviceCharge > 0 ? `<div class="row"><span>Service Charge:</span><span>₹${serviceCharge.toFixed(2)}</span></div>` : ''}
            <div class="grand-total row"><span>TOTAL AMOUNT:</span><span>₹${finalTotal.toFixed(2)}</span></div>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Payment Mode:</span><span><strong>${(session.payment_method || 'cash').toUpperCase()}</strong></span></div>
          <div style="text-align: center; margin: 10px 0;"><strong>PAID</strong></div>
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div>Visit again soon!</div>
            <div style="margin-top: 10px; font-size: 10px;">Generated by: ${session.generated_by || 'System'} | ${billTime}</div>
          </div>
        </div>
      </body>
      </html>
    `.trim();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } catch (error) {
    console.error('Error printing detailed bill:', error);
  }
}

