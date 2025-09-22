// AdminOrderManagement.js - Component for managing table orders

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

  // Load table orders when component opens
  useEffect(() => {
    if (isOpen && table) {
      loadTableOrders();
    }
  }, [isOpen, table]);

  const loadTableOrders = async () => {
    if (!table || !makeAuthenticatedRequest) return;

    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/manage_orders/`);
      
      if (response && response.ok) {
        const data = await response.json();
        setTableOrders(data.orders || []);
      } else {
        throw new Error('Failed to load table orders');
      }
    } catch (error) {
      console.error('Error loading table orders:', error);
      toast.error('Failed to load table orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderQuantity = async (orderId, newQuantity) => {
    if (newQuantity <= 0) return;

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
        await loadTableOrders();
        if (onOrdersUpdated) onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order quantity:', error);
      toast.error('Network error updating order');
    }
  };

  const updateOrderInstructions = async (orderId, newInstructions) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_instructions',
          special_instructions: newInstructions
        })
      });

      if (response && response.ok) {
        toast.success('Order instructions updated');
        await loadTableOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update instructions');
      }
    } catch (error) {
      console.error('Error updating instructions:', error);
      toast.error('Network error updating instructions');
    }
  };

  const updateOrderPriority = async (orderId, newPriority) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_priority',
          priority: newPriority
        })
      });

      if (response && response.ok) {
        toast.success('Order priority updated');
        await loadTableOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Network error updating priority');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/restaurant/orders/${orderId}/admin_modify/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel_order'
        })
      });

      if (response && response.ok) {
        toast.success('Order cancelled');
        await loadTableOrders();
        if (onOrdersUpdated) onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Network error cancelling order');
    }
  };

  const addCustomItem = async () => {
    if (!newItem.item_name || !newItem.unit_price) {
      toast.error('Please fill in item name and price');
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
        toast.success('Custom item added successfully');
        setNewItem({
          item_name: '',
          quantity: 1,
          unit_price: 0,
          special_instructions: ''
        });
        setShowAddItemModal(false);
        await loadTableOrders();
        if (onOrdersUpdated) onOrdersUpdated();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add custom item');
      }
    } catch (error) {
      console.error('Error adding custom item:', error);
      toast.error('Network error adding custom item');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">
              📝 Manage Orders - Table {table.table_number}
            </h3>
            <p className="text-sm text-gray-600">
              Admin order management interface
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Add Item Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAddItemModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <span>+</span>
            Add Custom Item
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tableOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">📝 No orders found for this table</p>
                <p className="text-sm mt-2">Add items using the button above</p>
              </div>
            ) : (
              tableOrders.map(order => (
                <div key={order.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{order.menu_item_name}</h4>
                      <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(order.total_price)}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(order.unit_price)} × {order.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Order Management Controls */}
                  {order.can_modify && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white rounded border">
                      {/* Quantity Control */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Quantity:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateOrderQuantity(order.id, order.quantity - 1)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            disabled={order.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{order.quantity}</span>
                          <button
                            onClick={() => updateOrderQuantity(order.id, order.quantity + 1)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Priority Control */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Priority:</label>
                        <select
                          value={order.priority || 'normal'}
                          onChange={(e) => updateOrderPriority(order.id, e.target.value)}
                          className="w-full px-3 py-1 border rounded text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      {/* Cancel Button */}
                      <div className="flex items-end">
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 w-full"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Special Instructions:</label>
                    <textarea
                      value={order.special_instructions || ''}
                      onChange={(e) => {
                        // Update locally first
                        const updatedOrders = tableOrders.map(o => 
                          o.id === order.id ? { ...o, special_instructions: e.target.value } : o
                        );
                        setTableOrders(updatedOrders);
                      }}
                      onBlur={(e) => updateOrderInstructions(order.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded text-sm"
                      rows="2"
                      placeholder="Add special instructions..."
                      disabled={!order.can_modify}
                    />
                  </div>

                  {!order.can_modify && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Cannot modify {order.status} orders
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add Custom Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold">Add Custom Item</h4>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Special Instructions</label>
                <textarea
                  value={newItem.special_instructions}
                  onChange={(e) => setNewItem({...newItem, special_instructions: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                  placeholder="Any special instructions..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addCustomItem}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
