import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function DynamicEnhancedBilling() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingItems, setEditingItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [applyGST, setApplyGST] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    fetchActiveOrders();
    fetchMenuItems();
    const interval = setInterval(fetchActiveOrders, 15000); // Auto-refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('/api/tables/active-orders-for-billing/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu/items/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setEditingItems([...order.items]);
  };

  const updateItemQuantity = (itemIndex, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0 or less
      setEditingItems(editingItems.filter((_, index) => index !== itemIndex));
    } else {
      const updatedItems = [...editingItems];
      updatedItems[itemIndex].quantity = newQuantity;
      setEditingItems(updatedItems);
    }
  };

  const addNewItem = (menuItem, quantity = 1) => {
    const newItem = {
      id: Date.now(), // Temporary ID for new items
      menu_item: menuItem,
      quantity: quantity,
      price: parseFloat(menuItem.price),
      special_instructions: '',
      is_new: true // Flag to identify new items
    };
    setEditingItems([...editingItems, newItem]);
    setShowAddItemModal(false);
  };

  const removeItem = (itemIndex) => {
    setEditingItems(editingItems.filter((_, index) => index !== itemIndex));
  };

  const updateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/tables/orders/${selectedOrder.id}/update-items/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          items: editingItems.map(item => ({
            id: item.is_new ? null : item.id,
            menu_item_id: item.menu_item.id,
            quantity: item.quantity,
            price: item.price,
            special_instructions: item.special_instructions
          }))
        })
      });

      if (response.ok) {
        toast.success('Order updated successfully');
        fetchActiveOrders();
        
        // Update the selected order with new data
        const updatedOrder = await response.json();
        setSelectedOrder(updatedOrder);
        setEditingItems([...updatedOrder.items]);
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Network error updating order');
    } finally {
      setLoading(false);
    }
  };

  const generateBill = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const response = await fetch('/api/bills/generate-from-order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          payment_method: paymentMethod,
          discount_percentage: discountPercentage,
          apply_gst: applyGST
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Bill generated! Receipt: ${result.receipt_number}`);
        
        // Reset state and refresh orders
        setSelectedOrder(null);
        setEditingItems([]);
        fetchActiveOrders();
        
        // Optionally redirect to bill details or print receipt
        if (result.bill_id) {
          window.open(`/bills/${result.bill_id}`, '_blank');
        }
      } else {
        const error = await response.json();
        toast.error('Failed to generate bill: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('Network error generating bill');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return editingItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = applyGST ? taxableAmount * 0.18 : 0;
    return taxableAmount + gstAmount;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">🧾 Dynamic Enhanced Billing</h1>
                <p className="text-gray-600">Manage orders from tables dynamically and generate bills with GST</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchActiveOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  disabled={loading}
                >
                  🔄 Refresh Orders
                </button>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Left Panel - Active Orders */}
            <div className="w-1/2 border-r">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">📋 Active Table Orders ({activeOrders.length})</h2>
                
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="text-lg font-medium">No active orders</p>
                    <p className="text-sm">All tables are free or orders are already billed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map(order => (
                      <div 
                        key={order.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedOrder?.id === order.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">🪑 Table {order.table_number}</h3>
                            <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              👤 {order.customer_name || 'Guest'} | 📱 {order.customer_phone || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              🕒 {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">₹{order.total_amount}</p>
                            <p className="text-sm text-gray-600">{order.items?.length || 0} items</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'ready' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick item preview */}
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium">Items:</p>
                          <div className="text-sm text-gray-600">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <span key={index}>
                                {item.menu_item?.name_en} x{item.quantity}
                                {index < Math.min(2, order.items.length - 1) ? ', ' : ''}
                              </span>
                            ))}
                            {order.items?.length > 3 && <span>... +{order.items.length - 3} more</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Order Details & Billing */}
            <div className="w-1/2">
              <div className="p-6">
                {!selectedOrder ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">👈</div>
                    <p className="text-lg font-medium">Select an order</p>
                    <p className="text-sm">Choose an order from the left panel to view details and generate bill</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold">🪑 Table {selectedOrder.table_number}</h2>
                        <p className="text-sm text-gray-600">Order #{selectedOrder.order_number}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddItemModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          ➕ Add Item
                        </button>
                        
                        <button
                          onClick={updateOrder}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          disabled={loading}
                        >
                          💾 Update Order
                        </button>
                      </div>
                    </div>

                    {/* Order Items Editing */}
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">📋 Order Items:</h3>
                      <div className="space-y-3">
                        {editingItems.map((item, index) => (
                          <div key={item.id || index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {item.menu_item?.name_en || item.name}
                                  {item.is_new && <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">NEW</span>}
                                </h4>
                                <p className="text-sm text-gray-600">₹{item.price} each</p>
                                {item.special_instructions && (
                                  <p className="text-sm text-blue-600">Note: {item.special_instructions}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                  className="bg-red-100 text-red-600 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                                >
                                  -
                                </button>
                                
                                <span className="font-medium w-8 text-center">{item.quantity}</span>
                                
                                <button
                                  onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                  className="bg-green-100 text-green-600 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                                >
                                  +
                                </button>
                                
                                <button
                                  onClick={() => removeItem(index)}
                                  className="bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm ml-2"
                                >
                                  ×
                                </button>
                                
                                <span className="font-bold ml-2">₹{(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Billing Controls */}
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">💳 Billing Options:</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Method:</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full border rounded px-3 py-2"
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
                            className="w-full border rounded px-3 py-2"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={applyGST}
                            onChange={(e) => setApplyGST(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Apply GST (18%)</span>
                        </label>
                      </div>

                      {/* Bill Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">📊 Bill Summary:</h4>
                        {(() => {
                          const subtotal = calculateSubtotal();
                          const discountAmount = (subtotal * discountPercentage) / 100;
                          const taxableAmount = subtotal - discountAmount;
                          const gstAmount = applyGST ? taxableAmount * 0.18 : 0;
                          const total = taxableAmount + gstAmount;

                          return (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                              </div>
                              {discountAmount > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Discount ({discountPercentage}%):</span>
                                  <span>-₹{discountAmount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Taxable Amount:</span>
                                <span>₹{taxableAmount.toFixed(2)}</span>
                              </div>
                              {applyGST && (
                                <>
                                  <div className="flex justify-between">
                                    <span>CGST (9%):</span>
                                    <span>₹{(gstAmount / 2).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SGST (9%):</span>
                                    <span>₹{(gstAmount / 2).toFixed(2)}</span>
                                  </div>
                                </>
                              )}
                              <div className="flex justify-between font-bold text-lg border-t pt-1">
                                <span>TOTAL:</span>
                                <span>₹{total.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <button
                        onClick={generateBill}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-lg"
                        disabled={loading || editingItems.length === 0}
                      >
                        {loading ? 'Generating Bill...' : '🧾 Generate Bill & Free Table'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">➕ Add Menu Item</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid gap-3">
              {menuItems.map(item => (
                <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.name_en}</h4>
                      {item.name_hi && <p className="text-sm text-gray-600">{item.name_hi}</p>}
                      <p className="text-sm text-green-600 font-medium">₹{item.price}</p>
                    </div>
                    
                    <button
                      onClick={() => addNewItem(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(DynamicEnhancedBilling, ['admin', 'staff']);
