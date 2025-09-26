// components/AdminOrderManagement.js - COMPLETE WORKING VERSION
// This file fixes all manage orders functionality with proper API calls and quantity controls
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const AdminOrderManagement = ({ table, isOpen, onClose, onOrdersUpdated }) => {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [tableOrders, setTableOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  
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
      
      // FIXED: Use the correct manage_orders endpoint
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/manage_orders/`);
      
      if (response && response.ok) {
        const data = await response.json();
        console.log('🔍 Manage orders response:', data);
        
        // FIXED: Use the orders array directly from manage_orders response
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

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel_order'
        })
      });

      if (response && response.ok) {
        toast.success('Order cancelled');
        loadTableOrders();
        onOrdersUpdated && onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(`Failed to cancel order: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🔧 Manage Orders - Table {table?.table_number}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading orders...</div>
          </div>
        ) : (
          <>
            {/* Add Custom Item Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ➕ Add Custom Item
              </button>
            </div>

            {/* Orders List */}
            {tableOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600">This table doesn't have any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tableOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`border-l-4 ${getPriorityColor(order.priority)} bg-white p-4 rounded-lg shadow-sm border border-gray-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{order.menu_item_name}</h3>
                        <p className="text-sm text-gray-600">
                          Order #{order.order_number} • Created by: {order.created_by_name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* FIXED: Quantity Controls with proper +/- buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-gray-600">Quantity:</label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (order.quantity > 1) {
                                updateOrderQuantity(order.id, order.quantity - 1);
                              }
                            }}
                            disabled={order.status === 'served' || order.status === 'cancelled' || order.quantity <= 1}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 bg-gray-100 rounded min-w-[40px] text-center">{order.quantity}</span>
                          <button
                            onClick={() => updateOrderQuantity(order.id, order.quantity + 1)}
                            disabled={order.status === 'served' || order.status === 'cancelled'}
                            className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600">Unit Price:</label>
                        <div className="font-semibold">₹{parseFloat(order.unit_price || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-gray-600">Total:</label>
                        <div className="font-semibold text-lg">₹{parseFloat(order.total_price || 0).toFixed(2)}</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600">Priority:</label>
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
                      <label className="block text-sm text-gray-600">Special Instructions:</label>
                      <textarea
                        value={order.special_instructions || ''}
                        onChange={(e) => updateOrderInstructions(order.id, e.target.value)}
                        disabled={order.status === 'served' || order.status === 'cancelled'}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        rows="2"
                        placeholder="Enter special instructions..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status !== 'served' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
                        >
                          🗑️ Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Custom Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Custom Item</h3>
              
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
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setNewItem({
                      item_name: '',
                      quantity: 1,
                      unit_price: 0,
                      special_instructions: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomItem}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderManagement;
