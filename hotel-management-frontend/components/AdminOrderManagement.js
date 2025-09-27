// Enhanced AdminOrderManagement.js with Complete Cancel Order Functionality
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const AdminOrderManagement = ({ table, isOpen, onClose, onOrdersUpdated }) => {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [tableOrders, setTableOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Form state for adding custom items
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    special_instructions: ''
  });

  useEffect(() => {
    if (isOpen && table) {
      loadTableOrders();
    }
  }, [isOpen, table]);

  const loadTableOrders = async () => {
    if (!table) return;
    
    try {
      setLoading(true);
      console.log(`🔍 Loading manage orders for table ID: ${table.id}`);
      
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/manage_orders/`);
      
      if (response && response.ok) {
        const data = await response.json();
        console.log('🔍 Manage orders response:', data);
        
        setTableOrders(data.orders || []);
      } else {
        console.error('Failed to load table orders');
        setTableOrders([]);
        toast.error('Failed to load table orders');
      }
    } catch (error) {
      console.error('Error loading table orders:', error);
      toast.error('Failed to load orders');
      setTableOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // MAIN CANCEL ORDER FUNCTION - Enhanced with Kitchen Display Integration
  const handleCancelOrder = (order) => {
    if (order.status === 'served') {
      toast.error('❌ Cannot cancel served orders');
      return;
    }
    if (order.status === 'cancelled') {
      toast.info('ℹ️ Order is already cancelled');
      return;
    }
    
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderToCancel.id}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel_order',
          cancel_reason: cancelReason,
          cancelled_by: user?.email || 'Admin'
        })
      });

      if (response && response.ok) {
        toast.success(`✅ Order #${orderToCancel.order_number} cancelled successfully`);
        
        // Update the local state to reflect cancellation
        setTableOrders(prev => 
          prev.map(order => 
            order.id === orderToCancel.id 
              ? { ...order, status: 'cancelled', cancel_reason: cancelReason }
              : order
          )
        );
        
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancelReason('');
        
        // Refresh orders and notify parent
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
        
        // Show success message with order details
        toast.success(`Order cancelled: ${orderToCancel.menu_item_name} x${orderToCancel.quantity}`, {
          duration: 4000,
          icon: '❌'
        });
        
        // Show kitchen notification
        toast.success('Kitchen display updated with cancellation', {
          duration: 3000,
          icon: '🍳'
        });
        
      } else {
        const error = await response.json();
        toast.error(`Failed to cancel order: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const updateOrderQuantity = async (orderId, newQuantity) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_quantity',
          quantity: newQuantity
        })
      });
      
      if (response && response.ok) {
        toast.success('Order quantity updated');
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(`Failed to update quantity: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const updateOrderInstructions = async (orderId, instructions) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_instructions',
          special_instructions: instructions
        })
      });
      
      if (response && response.ok) {
        toast.success('Instructions updated');
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(`Failed to update instructions: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating instructions:', error);
      toast.error('Failed to update instructions');
    }
  };

  const updateOrderPriority = async (orderId, priority) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_priority',
          priority: priority
        })
      });
      
      if (response && response.ok) {
        toast.success('Priority updated');
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(`Failed to update priority: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const addCustomItem = async () => {
    if (!newItem.item_name.trim() || newItem.unit_price <= 0) {
      toast.error('Please provide valid item name and price');
      return;
    }
    
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/manage_orders/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_custom_item',
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          special_instructions: newItem.special_instructions
        })
      });
      
      if (response && response.ok) {
        toast.success('Custom item added');
        setShowAddItemModal(false);
        setNewItem({
          item_name: '',
          quantity: 1,
          unit_price: 0,
          special_instructions: ''
        });
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(`Failed to add item: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding custom item:', error);
      toast.error('Failed to add custom item');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-purple-100 text-purple-800 border-purple-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      served: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-l-gray-400',
      normal: 'border-l-blue-400',
      high: 'border-l-orange-400',
      urgent: 'border-l-red-400'
    };
    return colors[priority] || colors.normal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header with Home Button */}
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-bold text-gray-900">
              🔧 Manage Orders - Table {table?.table_number}
            </h3>
            {/* HOME BUTTON IN MODAL */}
            <Link href="/admin/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              🏠 HOME
            </Link>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-4">
              Loading orders...
            </div>
          ) : (
            <>
              {/* Add Custom Item Button */}
              <div className="mb-4 flex justify-between items-center">
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  + Add Custom Item
                </button>
                
                {/* Instructions for cancellation */}
                <div className="text-sm text-gray-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                  💡 Click "Cancel" on any order to cancel it (will appear in Kitchen Display)
                </div>
              </div>

              {/* Orders List */}
              {tableOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-500">This table doesn't have any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tableOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`border-l-4 ${getPriorityColor(order.priority)} bg-white p-4 rounded-lg shadow-sm border border-gray-200`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{order.menu_item_name}</h4>
                          <p className="text-sm text-gray-600">
                            Order #{order.order_number} • Created by: {order.created_by_name}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          
                          {/* CANCEL BUTTON - PROMINENTLY DISPLAYED */}
                          {order.status !== 'served' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium flex items-center space-x-1 transition-all hover:scale-105"
                              title="Cancel Order"
                            >
                              <span>❌</span>
                              <span>CANCEL</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Show cancellation reason if cancelled */}
                      {order.status === 'cancelled' && order.cancel_reason && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>❌ CANCELLED:</strong> {order.cancel_reason}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            This order has been removed from Kitchen Display
                          </p>
                        </div>
                      )}

                      {/* Order Details - Rest of the existing code remains the same... */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity:</label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateOrderQuantity(order.id, order.quantity - 1)}
                              disabled={order.status === 'served' || order.status === 'cancelled' || order.quantity <= 1}
                              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-gray-100 rounded min-w-[40px] text-center">
                              {order.quantity}
                            </span>
                            <button
                              onClick={() => updateOrderQuantity(order.id, order.quantity + 1)}
                              disabled={order.status === 'served' || order.status === 'cancelled'}
                              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price:</label>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{parseFloat(order.unit_price || 0).toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total:</label>
                          <span className="text-lg font-semibold text-blue-600">
                            ₹{parseFloat(order.total_price || 0).toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority:</label>
                          <select
                            value={order.priority || 'normal'}
                            onChange={(e) => updateOrderPriority(order.id, e.target.value)}
                            disabled={order.status === 'served' || order.status === 'cancelled'}
                            className="px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions:</label>
                        <textarea
                          value={order.special_instructions || ''}
                          onChange={(e) => updateOrderInstructions(order.id, e.target.value)}
                          disabled={order.status === 'served' || order.status === 'cancelled'}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          rows="2"
                          placeholder="Enter special instructions..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">❌ Cancel Order</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to cancel <strong>{orderToCancel.menu_item_name}</strong> (x{orderToCancel.quantity})?
                </p>
                <p className="text-xs text-red-600 mb-4">
                  ⚠️ This order will be removed from the Kitchen Display and marked as cancelled
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for cancellation *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows="3"
                    placeholder="Enter reason for cancellation..."
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-between space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium"
                >
                  ❌ Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Item Modal - Existing code remains the same... */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Custom Item</h3>
              {/* HOME BUTTON IN ADD ITEM MODAL */}
              <Link href="/admin/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
                🏠 HOME
              </Link>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={newItem.special_instructions}
                  onChange={(e) => setNewItem({...newItem, special_instructions: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional instructions"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={addCustomItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderManagement;

