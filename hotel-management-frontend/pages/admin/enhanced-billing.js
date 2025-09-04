
// pages/admin/enhanced-billing.js - Complete Enhanced Billing System
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function EnhancedBilling() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [readyOrders, setReadyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billResult, setBillResult] = useState(null);

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReadyOrders = async () => {
    try {
      const response = await fetch('/api/bills/orders_ready_for_billing/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReadyOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching ready orders:', error);
    }
  };

  const generateBillFromOrder = async (order) => {
    setLoading(true);
    try {
      const response = await fetch('/api/bills/generate_bill_from_order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          order_id: order.id,
          payment_method: paymentMethod,
          discount_percentage: discountPercentage
        })
      });

      if (response.ok) {
        const result = await response.json();

        setBillResult({
          success: true,
          bill_id: result.bill_id,
          receipt_number: result.receipt_number,
          gst_breakdown: result.gst_breakdown,
          order: order
        });

        toast.success('Bill generated successfully!');
        fetchReadyOrders();
      } else {
        const error = await response.json();
        toast.error('Failed to generate bill: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (order) => {
    if (!order.items || order.items.length === 0) {
      return parseFloat(order.total_amount || 0);
    }
    return order.items.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      return sum + (price * (item.quantity || 1));
    }, 0);
  };

  const calculateTotalWithGST = (order) => {
    const subtotal = calculateSubtotal(order);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = taxableAmount * 0.18;
    return taxableAmount + gstAmount;
  };

  const printReceipt = (billData) => {
    const printWindow = window.open('', '_blank');
    const subtotal = calculateSubtotal(billData.order);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = taxableAmount * 0.18;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hotel Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .line-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .gst-section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>HOTEL RECEIPT</h2>
            <p>Receipt #: ${billData.receipt_number}</p>
            <p>Table: ${billData.order.table_number}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Customer: ${billData.order.customer_name || 'Guest'}</p>
          </div>

          <div class="items">
            ${billData.order.items?.map(item => `
              <div class="line-item">
                <span>${item.name || 'Item'} x ${item.quantity}</span>
                <span>₹${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>

          <div class="line-item">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>

          ${discountAmount > 0 ? `
            <div class="line-item">
              <span>Discount (${discountPercentage}%):</span>
              <span>-₹${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="line-item">
            <span>Taxable Amount:</span>
            <span>₹${taxableAmount.toFixed(2)}</span>
          </div>

          <div class="gst-section">
            <div class="line-item">
              <span>CGST (9%):</span>
              <span>₹${(gstAmount / 2).toFixed(2)}</span>
            </div>
            <div class="line-item">
              <span>SGST (9%):</span>
              <span>₹${(gstAmount / 2).toFixed(2)}</span>
            </div>
          </div>

          <div class="total">
            <div class="line-item">
              <span>TOTAL:</span>
              <span>₹${calculateTotalWithGST(billData.order).toFixed(2)}</span>
            </div>
            <div class="line-item">
              <span>Payment Method:</span>
              <span>${paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your visit!</p>
            <p>GST Registration: [Your GST Number]</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            💳 {language === 'hi' ? 'एक-क्लिक बिलिंग' : 'One-Click Billing'}
          </h1>
          <p className="text-gray-600">
            {language === 'hi' 
              ? 'पूर्ण ऑर्डर के लिए स्वचालित GST गणना के साथ बिल जनरेट करें'
              : 'Generate bills for completed orders with automatic GST calculation'
            }
          </p>
        </div>

        {/* Success Message */}
        {billResult && (
          <div className="p-4 bg-green-50 border-l-4 border-green-400 m-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  ✅ {language === 'hi' ? 'बिल सफलतापूर्वक बनाया गया!' : 'Bill Generated Successfully!'}
                </h3>
                <p className="text-green-700">Receipt #{billResult.receipt_number}</p>
                <p className="text-green-700">
                  Amount: ₹{billResult.gst_breakdown?.total_amount?.toFixed(2) || calculateTotalWithGST(billResult.order).toFixed(2)}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => printReceipt(billResult)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  🖨️ {language === 'hi' ? 'प्रिंट रसीद' : 'Print Receipt'}
                </button>
                <button
                  onClick={() => setBillResult(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Ready for Billing */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            📋 {language === 'hi' ? 'बिलिंग के लिए तैयार ऑर्डर' : 'Orders Ready for Billing'} ({readyOrders.length})
          </h2>

          {readyOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">🎉 {language === 'hi' ? 'कोई बिलिंग बाकी नहीं' : 'No orders pending billing'}</p>
              <p className="text-sm">{language === 'hi' ? 'सभी ऑर्डर प्रोसेस हो गए हैं' : 'All orders have been processed'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-bold text-lg">
                          🪑 {language === 'hi' ? 'टेबल' : 'Table'} {order.table_number}
                        </h3>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          #{order.order_number}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>👤 {language === 'hi' ? 'ग्राहक' : 'Customer'}: {order.customer_name || 'Guest'}</div>
                        <div>📱 {language === 'hi' ? 'फोन' : 'Phone'}: {order.customer_phone || 'N/A'}</div>
                        <div>🕒 {language === 'hi' ? 'ऑर्डर समय' : 'Ordered'}: {new Date(order.created_at).toLocaleString()}</div>
                        <div>📦 {language === 'hi' ? 'आइटम' : 'Items'}: {order.items?.length || 0}</div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <h4 className="font-medium mb-2">{language === 'hi' ? 'ऑर्डर आइटम:' : 'Order Items:'}</h4>
                        <div className="space-y-1">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {language === 'hi' 
                                  ? (item.name_hi || item.name || 'Item')
                                  : (item.name || 'Item')
                                } x {item.quantity || 1}
                              </span>
                              <span>₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                            </div>
                          )) || (
                            <div className="text-sm text-gray-500">No items available</div>
                          )}
                        </div>
                        <div className="border-t pt-2 mt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>{language === 'hi' ? 'सबटोटल:' : 'Subtotal:'}</span>
                            <span>₹{calculateSubtotal(order).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Controls */}
                    <div className="ml-6 bg-gray-50 rounded-lg p-4 min-w-[280px]">
                      <h4 className="font-medium mb-3">💰 {language === 'hi' ? 'बिलिंग विकल्प' : 'Billing Options'}</h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {language === 'hi' ? 'भुगतान विधि:' : 'Payment Method:'}
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          >
                            <option value="cash">💵 {language === 'hi' ? 'नकद' : 'Cash'}</option>
                            <option value="card">💳 {language === 'hi' ? 'कार्ड' : 'Card'}</option>
                            <option value="upi">📱 UPI</option>
                            <option value="online">🌐 {language === 'hi' ? 'ऑनलाइन' : 'Online'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {language === 'hi' ? 'छूट (%):'  : 'Discount (%):'}
                          </label>
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
                          <div className="font-medium mb-1">
                            {language === 'hi' ? 'GST गणना पूर्वावलोकन:' : 'GST Calculation Preview:'}
                          </div>
                          {(() => {
                            const subtotal = calculateSubtotal(order);
                            const discountAmount = (subtotal * discountPercentage) / 100;
                            const taxableAmount = subtotal - discountAmount;
                            const gstAmount = taxableAmount * 0.18;
                            const total = taxableAmount + gstAmount;

                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>{language === 'hi' ? 'सबटोटल:' : 'Subtotal:'}</span>
                                  <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discountAmount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>{language === 'hi' ? 'छूट:' : 'Discount:'}</span>
                                    <span>-₹{discountAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>CGST (9%):</span>
                                  <span>₹{(gstAmount / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (9%):</span>
                                  <span>₹{(gstAmount / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-1">
                                  <span>{language === 'hi' ? 'कुल:' : 'Total:'}</span>
                                  <span>₹{total.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          onClick={() => generateBillFromOrder(order)}
                          disabled={loading}
                          className="w-full bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600 disabled:opacity-50"
                        >
                          {loading ? (language === 'hi' ? 'बना रहे हैं...' : 'Generating...') : '🧾 ' + (language === 'hi' ? 'बिल बनाएं' : 'Generate Bill')}
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
}

export default withRoleGuard(EnhancedBilling, ['admin', 'staff']);

