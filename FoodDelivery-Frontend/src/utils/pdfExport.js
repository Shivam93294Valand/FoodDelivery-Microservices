export const generateOrderPDF = (order) => {
  const printWindow = window.open('', '_blank')
  
  const items = order.orderItems ?? order.OrderItems ?? []
  const orderId = order.orderId ?? order.OrderId
  const restaurantName = order.restaurantName ?? order.RestaurantName ?? 'Restaurant'
  const totalAmount = order.totalAmount ?? order.TotalAmount ?? 0
  const subtotal = order.subtotal ?? order.Subtotal ?? 0
  const deliveryFee = order.deliveryFee ?? order.DeliveryFee ?? 0
  const tax = order.tax ?? order.Tax ?? 0
  const deliveryAddress = order.deliveryAddress ?? order.DeliveryAddress ?? 'No address provided'
  const createdAt = order.createdAt ?? order.CreatedAt
  const paymentMethod = order.paymentMethod ?? order.PaymentMethod ?? 'Unknown'
  const paymentStatus = order.paymentStatus ?? order.PaymentStatus ?? 'Pending'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order #${orderId} - Invoice</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f97316;
          }
          .logo {
            font-size: 32px;
            font-weight: 900;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .invoice-info p {
            color: #6b7280;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            color: #1f2937;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          thead {
            background: #f97316;
            color: white;
          }
          th {
            padding: 15px;
            text-align: left;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          tbody tr:hover {
            background: #f9fafb;
          }
          .text-right {
            text-align: right;
          }
          .summary {
            max-width: 400px;
            margin-left: auto;
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
          }
          .summary-row:not(:last-child) {
            border-bottom: 1px solid #e5e7eb;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: 900;
            color: #f97316;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #f97316;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="logo">🍔 Food Delivery</div>
            <p style="color: #6b7280; margin-top: 5px;">Delicious food at your doorstep</p>
          </div>
          <div class="invoice-info">
            <h1>Invoice</h1>
            <p>Order #${orderId}</p>
            <p>${createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Restaurant</div>
            <div class="info-value">${restaurantName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${paymentMethod}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Status</div>
            <div class="info-value">${paymentStatus}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Order Time</div>
            <div class="info-value">${createdAt ? new Date(createdAt).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Delivery Address</div>
          <div class="info-item">
            <p style="font-size: 14px; color: #374151;">${deliveryAddress}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td><strong>${item.itemName || item.ItemName}</strong></td>
                  <td class="text-right">${item.quantity ?? item.Quantity}</td>
                  <td class="text-right">$${(item.unitPrice ?? item.UnitPrice ?? 0).toFixed(2)}</td>
                  <td class="text-right"><strong>$${(item.totalPrice ?? item.TotalPrice ?? 0).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <strong>$${subtotal.toFixed(2)}</strong>
          </div>
          <div class="summary-row">
            <span>Delivery Fee:</span>
            <strong>$${deliveryFee.toFixed(2)}</strong>
          </div>
          <div class="summary-row">
            <span>Tax:</span>
            <strong>$${tax.toFixed(2)}</strong>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>$${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p style="margin-top: 5px;">For any questions, please contact our support team</p>
        </div>

        <script>
          window.onload = () => {
            window.print()
            // Close window after printing or canceling
            setTimeout(() => window.close(), 100)
          }
        </script>
      </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}

export const generateAllOrdersPDF = (orders) => {
  const printWindow = window.open('', '_blank')
  
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount ?? order.TotalAmount ?? 0), 0)
  const totalOrders = orders.length
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>All Orders Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f97316;
          }
          .logo {
            font-size: 36px;
            font-weight: 900;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
          }
          h1 {
            font-size: 32px;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .date {
            color: #6b7280;
            font-size: 14px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .stat-card {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
          }
          .stat-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .stat-value {
            font-size: 32px;
            font-weight: 900;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          thead {
            background: #f97316;
            color: white;
          }
          th {
            padding: 15px;
            text-align: left;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          .text-right {
            text-align: right;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-success {
            background: #dcfce7;
            color: #166534;
          }
          .badge-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="logo">Food Delivery</div>
          <h1>Orders Report</h1>
          <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Status</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => {
              const orderId = order.orderId ?? order.OrderId
              const restaurantName = order.restaurantName ?? order.RestaurantName ?? 'Restaurant'
              const totalAmount = order.totalAmount ?? order.TotalAmount ?? 0
              const status = order.orderStatus ?? order.OrderStatus ?? 'Pending'
              const createdAt = order.createdAt ?? order.CreatedAt
              
              const statusClass = status === 'Delivered' ? 'badge-success' : 
                                  status === 'Cancelled' ? 'badge-cancelled' : 
                                  'badge-pending'
              
              return `
                <tr>
                  <td><strong>#${orderId}</strong></td>
                  <td>${restaurantName}</td>
                  <td>${createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td><span class="badge ${statusClass}">${status}</span></td>
                  <td class="text-right"><strong>$${totalAmount.toFixed(2)}</strong></td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated report</p>
          <p style="margin-top: 5px;">Food Delivery - All Rights Reserved</p>
        </div>

        <script>
          window.onload = () => {
            window.print()
            setTimeout(() => window.close(), 100)
          }
        </script>
      </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}

export const generatePaymentsPDF = (payments) => {
  const printWindow = window.open('', '_blank')

  const list = Array.isArray(payments) ? payments : []
  const totalAmount = list.reduce((sum, payment) => sum + Number(payment?.amount ?? 0), 0)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment History Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 36px; color: #1f2937; }
          .header { margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
          .title { font-size: 28px; font-weight: 800; }
          .meta { margin-top: 6px; color: #64748b; font-size: 13px; }
          .stats { display: flex; gap: 16px; margin: 20px 0 24px; }
          .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
          .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: .4px; }
          .value { margin-top: 6px; font-size: 22px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; }
          thead { background: #2563eb; color: white; }
          th, td { padding: 10px 12px; text-align: left; font-size: 13px; }
          td { border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .footer { margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Payment History</div>
          <div class="meta">Generated on ${new Date().toLocaleString()}</div>
        </div>

        <div class="stats">
          <div class="card">
            <div class="label">Total Transactions</div>
            <div class="value">${list.length}</div>
          </div>
          <div class="card">
            <div class="label">Total Amount</div>
            <div class="value">$${totalAmount.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Status</th>
              <th>Method</th>
              <th>Date</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((payment) => `
              <tr>
                <td>#${payment.orderId ?? 'N/A'}</td>
                <td>${payment.orderStatus ?? '-'}</td>
                <td>${payment.paymentMethod ?? '-'}</td>
                <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : '-'}</td>
                <td class="text-right">$${Number(payment.amount ?? 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">Food Delivery - Payment Report</div>

        <script>
          window.onload = () => {
            window.print()
            setTimeout(() => window.close(), 100)
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
