
// components/billing/OnClickBilling.js - One-Click Billing Component
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const OneClickBilling = () => {
  const { user } = useAuth();
  const [readyOrders, setReadyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billResult, setBillResult] = useState(null);

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchReadyOrders = async () => {
    try {
      const response = await fetch('/api/bills/orders_ready_for_billing/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await response.json();
      setReadyOrders(data);
    } catch (error) {
      console.error('Error fetching ready orders:', error);
    }
  };

  const generateBill = async (orderId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/bills/generate_bill_from_order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: paymentMethod,
          discount_percentage: discountPercentage
        })
      });

      const result = await response.json();

      if (result.success) {
        setBillResult(result);
        fetchReadyOrders(); // Refresh the list
        setSelectedOrder(null);
      } else {
        alert('Failed to generate bill: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (gstBreakdown) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .line-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .gst-section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>Hotel Receipt</h2>
              <p>Receipt #: ${billResult.receipt_number}</p>
              <p>Date: ${new Date().toLocaleString()}</p>
            </div>

            <div class="line-item">
              <span>Subtotal:</span>
              <span>₹${gstBreakdown.subtotal.toFixed(2)}</span>
            </div>

            ${gstBreakdown.discount_amount > 0 ? `
              <div class="line-item">
                <span>Discount (${gstBreakdown.discount_percentage}%):</span>
                <span>-₹${gstBreakdown.discount_amount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="line-item">
              <span>Taxable Amount:</span>
              <span>₹${gstBreakdown.taxable_amount.toFixed(2)}</span>
            </div>

            <div class="gst-section">
              <div class="line-item">
                <span>CGST (${gstBreakdown.cgst_rate}%):</span>
                <span>₹${gstBreakdown.cgst_amount.toFixed(2)}</span>
              </div>
              <div class="line-item">
                <span>SGST (${gstBreakdown.sgst_rate}%):</span>
                <span>₹${gstBreakdown.sgst_amount.toFixed(2)}</span>
              </div>
            </div>

            <div class="total">
              <div class="line-item">
                <span>TOTAL:</span>
                <span>₹${gstBreakdown.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p>Thank you for your visit!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">💳 One-Click Billing</h1>
          <p className="text-gray-600">Generate bills for completed orders with automatic GST calculation</p>
        </div>

        {/* Success Message */}
        {billResult && (
          <div className="p-4 bg-green-50 border-l-4 border-green-400 m-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-green-800">✅ Bill Generated Successfully!</h3>
                <p className="text-green-700">Receipt #{billResult.receipt_number}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => printReceipt(billResult.gst_breakdown)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={() => setBillResult(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Ready for Billing */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Orders Ready for Billing ({readyOrders.length})</h2>

          {readyOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">🎉 No orders pending billing</p>
              <p className="text-sm">All orders have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-bold text-lg">🪑 Table {order.table_number}</h3>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          #{order.order_number}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>👤 Customer: {order.customer_name || 'Guest'}</div>
                        <div>👨‍💼 Waiter: {order.waiter_name}</div>
                        <div>🕒 Ordered: {new Date(order.created_at).toLocaleString()}</div>
                        <div>📦 Items: {order.items_count}</div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <h4 className="font-medium mb-2">Order Items:</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.name} x {item.quantity}</span>
                              <span>₹{item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 mt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Controls */}
                    <div className="ml-6 bg-gray-50 rounded-lg p-4 min-w-[250px]">
                      <h4 className="font-medium mb-3">💰 Billing Options</h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Method:</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          >
                            <option value="cash">💵 Cash</option>
                            <option value="card">💳 Card</option>
                            <option value="upi">📱 UPI</option>
                            <option value="online">🌐 Online</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Discount (%):</label>
                          <input
                            type="number"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                            className="w-full border rounded px-2 py-1 text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>

                        {/* GST Preview */}
                        <div className="bg-white rounded p-2 text-xs">
                          <div className="font-medium mb-1">GST Calculation Preview:</div>
                          {(() => {
                            const subtotal = order.total_amount;
                            const discountAmount = (subtotal * discountPercentage) / 100;
                            const taxableAmount = subtotal - discountAmount;
                            const gstAmount = taxableAmount * 0.18;
                            const total = taxableAmount + gstAmount;

                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discountAmount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span>-₹{discountAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>GST (18%):</span>
                                  <span>₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-1">
                                  <span>Total:</span>
                                  <span>₹{total.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          onClick={() => generateBill(order.id)}
                          disabled={loading}
                          className="w-full bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600 disabled:opacity-50"
                        >
                          {loading ? 'Generating...' : '🧾 Generate Bill'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OneClickBilling;
