// pages/admin/table-management.js - COMPLETE UPDATED VERSION WITH ERROR HANDLING + AUTH FIX
// This file contains ALL fixes for billing and manage orders functionality + Error Handling + Advanced Booking
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminOrderManagement from '../../components/AdminOrderManagement';

// BILLING ORDERS COMPONENT - Enhanced with error handling
const BillingOrdersSection = ({ tableId }) => {
  const [orders, setOrders] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    if (tableId) {
      loadTableOrders();
    }
  }, [tableId]);

  const loadTableOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Loading orders for table ID: ${tableId}`);

      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${tableId}/manage_orders/`);

      if (response && response.ok) {
        const data = await response.json();
        console.log('🔍 Billing orders response:', data);

        setOrders(data.orders || []);
        setTotalAmount(data.total_amount || 0);
      } else {
        throw new Error('Failed to load table orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message);
      setOrders([]);
      setTotalAmount(0);
      toast.error('Failed to load orders for this table');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-600 text-lg mr-2">⚠️</span>
          <div>
            <h3 className="text-red-800 font-semibold">Error loading orders</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={loadTableOrders}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-600 text-lg mr-2">⚠️</span>
          <div>
            <h3 className="text-red-800 font-semibold">No orders found for this table</h3>
            <p className="text-red-700 text-sm">Orders may not be marked as served yet, or there's a data sync issue.</p>
            <button
              onClick={loadTableOrders}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">📋 Order Summary ({orders.length} items)</h3>

        <div className="space-y-2 mb-4">
          {orders.map((order, index) => (
            <div key={`billing-order-${order.id}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-200">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {order.menu_item_name}
                </div>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <span>x{order.quantity}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'served' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                  {order.special_instructions && (
                    <span className="text-gray-500 text-xs">
                      Note: {order.special_instructions}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  ₹{parseFloat(order.total_price || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  ₹{parseFloat(order.unit_price || 0).toFixed(2)} each
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-900">
            ₹{parseFloat(totalAmount).toFixed(2)}
          </div>
          <div className="text-sm text-blue-700">
            {orders.length} items • Total Amount (Including GST)
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">💰 GST Breakdown (18%)</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal (before GST):</span>
              <span>₹{(totalAmount / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST (9%):</span>
              <span>₹{((totalAmount - totalAmount / 1.18) / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (9%):</span>
              <span>₹{((totalAmount - totalAmount / 1.18) / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total (Including GST):</span>
              <span>₹{parseFloat(totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
const ErrorBoundary = ({ error, onRetry, onHome }) => (
  <div className="min-h-96 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🔄 Try Again
        </button>
        
        <Link
          href="/admin/dashboard"
          className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors"
        >
          🏠 Go to Dashboard
        </Link>
      </div>
    </div>
  </div>
);

// BOOKING NOTIFICATION COMPONENT - Shows across all pages
const BookingNotifications = ({ bookings }) => {
  if (!bookings || bookings.length === 0) return null;

  const todayBookings = bookings.filter(booking => {
    const today = new Date().toDateString();
    const bookingDate = new Date(booking.booking_date).toDateString();
    return today === bookingDate;
  });

  if (todayBookings.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start">
        <span className="text-blue-600 text-lg mr-2">📅</span>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-800 mb-1">Today's Bookings ({todayBookings.length})</h4>
          <div className="space-y-1">
            {todayBookings.slice(0, 3).map((booking, index) => (
              <div key={index} className="text-sm text-blue-700">
                <strong>{booking.customer_name}</strong> - {booking.customer_phone} 
                {booking.remaining_amount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    ₹{booking.remaining_amount} pending
                  </span>
                )}
              </div>
            ))}
            {todayBookings.length > 3 && (
              <p className="text-sm text-blue-600">+{todayBookings.length - 3} more bookings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function TableManagementDashboard() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);

  // Add Order Modal States
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [orderingTable, setOrderingTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // CRUD Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);
  const [billingTable, setBillingTable] = useState(null);

  // Admin Order Management States
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [managingTable, setManagingTable] = useState(null);

  // Booking States
  const [bookings, setBookings] = useState([]);

  // Form States
  const [newTableData, setNewTableData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    status: 'free',
    priority_level: 1,
    notes: ''
  });

  const [editTableData, setEditTableData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    status: 'free',
    priority_level: 1,
    notes: ''
  });

  // Billing form state
  const [billingData, setBillingData] = useState({
    customer_name: '',
    customer_phone: '',
    discount_amount: 0,
    discount_percentage: 0,
    service_charge: 0,
    payment_method: 'cash',
    notes: '',
    admin_notes: ''
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    loadInitialData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Automatic error recovery
  useEffect(() => {
    if (error && !loading) {
      const timer = setTimeout(() => {
        console.log('🔄 Attempting automatic recovery...');
        setError(null);
        loadInitialData();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [error, loading]);

  // Handle page visibility change to refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading && !refreshing) {
        console.log('👀 Page became visible, refreshing data...');
        loadInitialData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, refreshing]);

  const connectWebSocket = () => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/table-management/`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('✅ Table Management WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        console.log('❌ Table Management WebSocket disconnected');
        
        // Only reconnect if not a normal closure
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          handleWebSocketMessage(JSON.parse(event.data));
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
        }
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'table_status':
        setTables(data.tables || []);
        break;
      case 'table_updated':
        setTables(prev => prev.map(table =>
          table.id === data.table_id
            ? { ...table, status: data.status }
            : table
        ));
        break;
      case 'table_created':
        setTables(prev => [...prev, data.table]);
        toast.success(`New table ${data.table.table_number} created!`);
        break;
      case 'table_deleted':
        setTables(prev => prev.filter(table => table.id !== data.table_id));
        toast.info('Table removed from system');
        break;
      case 'new_order':
        setTables(prev => prev.map(table =>
          table.id === data.table_id
            ? { ...table, active_orders_count: data.order_count }
            : table
        ));
        break;
      case 'billing_completed':
        setTables(prev => prev.map(table =>
          table.id === data.table_id
            ? { ...table, status: 'free', active_orders_count: 0 }
            : table
        ));
        toast.success(`Billing completed for Table ${data.table_number}`);
        break;
    }
  };

  // ENHANCED loadInitialData with FIXED AUTH ISSUE
  const loadInitialData = async () => {
    try {
      setRefreshing(true);
      setError(null); // Clear previous errors
      
      console.log('🔍 Loading initial table data...');

      // FIXED: Use makeAuthenticatedRequest for all API calls to handle token refresh
      const [tablesResponse, statsResponse, bookingsResponse] = await Promise.all([
        makeAuthenticatedRequest('/api/restaurant/tables/with_orders/'),
        makeAuthenticatedRequest('/api/restaurant/dashboard-stats/'),
        makeAuthenticatedRequest('/api/restaurant/bookings/')
      ]);

      // Handle tables response
      if (tablesResponse && tablesResponse.ok) {
        const payload = await tablesResponse.json();
        console.log('🔍 Raw API response:', payload);

        // Validate data structure
        if (payload && (Array.isArray(payload) || payload.tables)) {
          // Extract the tables array (handle different response formats)
          const raw = Array.isArray(payload) ? payload : payload.tables || [];

          // Map with proper field extraction for new API structure
          const formatted = raw.map(tbl => {
            const sessionInfo = tbl.session_info || {};
            const currentBillAmount = tbl.current_bill_amount || 0;
            const hasOrders = sessionInfo.order_count > 0 || currentBillAmount > 0;

            console.log(`Table ${tbl.table_number}:`, {
              sessionInfo,
              currentBillAmount,
              hasOrders
            });

            return {
              ...tbl,
              // Active orders (for kitchen display)
              active_orders: tbl.active_orders || [],
              active_orders_count: tbl.active_orders_count || 0,

              // Billing information (mapped from actual API fields)
              session_orders_count: sessionInfo.order_count || 0,
              total_bill_amount: currentBillAmount,
              can_bill: hasOrders,
              has_served_orders: hasOrders,

              // Frontend display flags
              show_billing_options: hasOrders,
              is_billable: hasOrders,
              billing_ready: hasOrders,

              // Duration calculation
              time_occupied: tbl.occupancy_duration || 0
            };
          });

          console.log('✅ Tables loaded successfully:', formatted.length);
          setTables(formatted);

          // Try to restore previously selected table
          if (selectedTableId) {
            const foundTable = formatted.find(table => table.id === selectedTableId);
            if (foundTable) {
              setSelectedTable(foundTable);
              console.log('✅ Restored selected table:', foundTable.table_number);
            } else {
              console.log('⚠️ Previously selected table not found, clearing selection');
              setSelectedTable(null);
              setSelectedTableId(null);
              setBillingTable(null);
              setShowBillModal(false);
              setShowOrderManagement(false);
            }
          }
        } else {
          throw new Error('Invalid data structure received from API');
        }
      } else if (tablesResponse && tablesResponse.status === 401) {
        // Token refresh failed or invalid—redirect to login
        toast.error('Session expired. Redirecting to login...');
        localStorage.clear();
        window.location.href = '/login';
        return;
      } else {
        const errorData = await tablesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Failed to load tables');
      }

      // Handle stats response with auth error handling
      if (statsResponse && statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardStats(statsData);
      } else if (statsResponse && statsResponse.status === 401) {
        // Token refresh failed or invalid—redirect to login
        toast.error('Session expired. Redirecting to login...');
        localStorage.clear();
        window.location.href = '/login';
        return;
      } else {
        console.error('Failed to load dashboard stats');
      }

      // Handle bookings response
      if (bookingsResponse && bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.results || []);
      } else {
        console.log('Bookings not available or failed to load');
        setBookings([]);
      }

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError(error.message || 'Failed to load table data');
      
      // Safe fallbacks
      setTables([]);
      setSelectedTable(null);
      setSelectedTableId(null);
      setBillingTable(null);
      setShowBillModal(false);
      setShowOrderManagement(false);
      setBookings([]);
      
      toast.error(`Failed to load tables: ${error.message}`);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // SAFE table selection with validation
  const selectTableForBilling = async (table) => {
    try {
      if (!table || !table.id) {
        toast.error('Invalid table selected');
        return;
      }
      
      // Verify table still exists
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/`);
      
      if (response && response.ok) {
        const currentTableData = await response.json();
        
        setBillingTable(currentTableData);
        setSelectedTable(currentTableData);
        setSelectedTableId(currentTableData.id);
        setShowBillModal(true);
        
        console.log('✅ Table selected for billing:', currentTableData.table_number);
      } else {
        throw new Error('Table no longer exists');
      }
      
    } catch (error) {
      console.error('❌ Error selecting table:', error);
      toast.error('Table not found. Refreshing data...');
      
      // Refresh and clear selections
      await loadInitialData();
      setShowBillModal(false);
      setBillingTable(null);
    }
  };

  // SAFE order management
  const openOrderManagement = async (table) => {
    try {
      if (!table || !table.id) {
        toast.error('Invalid table selected');
        return;
      }
      
      // Verify table exists
      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${table.id}/`);
      
      if (response && response.ok) {
        const currentTableData = await response.json();
        setManagingTable(currentTableData);
        setSelectedTable(currentTableData);
        setSelectedTableId(currentTableData.id);
        setShowOrderManagement(true);
      } else {
        throw new Error('Table no longer exists');
      }
      
    } catch (error) {
      console.error('❌ Table access error:', error);
      toast.error('Table not found. Refreshing data...');
      await loadInitialData();
      setShowOrderManagement(false);
    }
  };

  // CRUD Functions (keeping existing functionality)
  const createTable = async () => {
    try {
      if (!newTableData.table_number.trim()) {
        toast.error('Please enter a table number');
        return;
      }

      if (newTableData.capacity < 1 || newTableData.capacity > 20) {
        toast.error('Table capacity must be between 1 and 20');
        return;
      }

      if (tables.some(table => table.table_number === newTableData.table_number)) {
        toast.error('Table number already exists');
        return;
      }

      const response = await makeAuthenticatedRequest('/api/restaurant/tables/', {
        method: 'POST',
        body: JSON.stringify(newTableData)
      });

      if (response && response.ok) {
        const newTable = await response.json();
        setTables(prev => [...prev, newTable]);
        setShowCreateModal(false);
        setNewTableData({
          table_number: '',
          capacity: 4,
          location: '',
          status: 'free',
          priority_level: 1,
          notes: ''
        });
        toast.success(`Table ${newTable.table_number} created successfully!`);
        loadInitialData();
      } else {
        const error = await response.json();
        toast.error(`Failed to create table: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Network error while creating table');
    }
  };

  const editTable = async () => {
    try {
      if (!editTableData.table_number.trim()) {
        toast.error('Please enter a table number');
        return;
      }

      if (editTableData.capacity < 1 || editTableData.capacity > 20) {
        toast.error('Table capacity must be between 1 and 20');
        return;
      }

      if (tables.some(table =>
        table.table_number === editTableData.table_number &&
        table.id !== editingTable.id
      )) {
        toast.error('Table number already exists');
        return;
      }

      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${editingTable.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(editTableData)
      });

      if (response && response.ok) {
        const updatedTable = await response.json();
        setTables(prev => prev.map(table =>
          table.id === editingTable.id ? updatedTable : table
        ));
        setShowEditModal(false);
        setEditingTable(null);
        toast.success(`Table ${updatedTable.table_number} updated successfully!`);
        loadInitialData();
      } else {
        const error = await response.json();
        toast.error(`Failed to update table: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Network error while updating table');
    }
  };

  const deleteTable = async () => {
    try {
      if (deletingTable.active_orders_count > 0) {
        toast.error('Cannot delete table with active orders');
        return;
      }

      if (deletingTable.status === 'occupied') {
        toast.error('Cannot delete occupied table');
        return;
      }

      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${deletingTable.id}/`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        setTables(prev => prev.filter(table => table.id !== deletingTable.id));
        setShowDeleteModal(false);
        setDeletingTable(null);
        toast.success(`Table ${deletingTable.table_number} deleted successfully!`);
        loadInitialData();
      } else {
        const error = await response.json();
        toast.error(`Failed to delete table: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Network error while deleting table');
    }
  };

  const completeBilling = async () => {
    try {
      if (!billingTable) return;
      if (!billingData.customer_name.trim()) {
        toast.error('Please enter customer name');
        return;
      }

      const response = await makeAuthenticatedRequest(`/api/restaurant/tables/${billingTable.id}/complete_billing/`, {
        method: 'POST',
        body: JSON.stringify({
          customer_name: billingData.customer_name,
          customer_phone: billingData.customer_phone,
          payment_method: billingData.payment_method,
          discount_amount: billingData.discount_amount,
          discount_percentage: billingData.discount_percentage,
          service_charge: billingData.service_charge,
          notes: billingData.notes,
          admin_notes: billingData.admin_notes
        })
      });

      if (response && response.ok) {
        const result = await response.json();
        toast.success(`✅ Billing completed! Total: ₹${result.final_amount}`);

        // Update tables state
        setTables(prev => prev.map(table =>
          table.id === billingTable.id
            ? {
              ...table,
              status: 'free',
              active_orders_count: 0,
              session_orders_count: 0,
              total_bill_amount: 0,
              can_bill: false,
              has_served_orders: false
            }
            : table
        ));

        setShowBillModal(false);
        setBillingTable(null);
        setBillingData({
          customer_name: '',
          customer_phone: '',
          discount_amount: 0,
          discount_percentage: 0,
          service_charge: 0,
          payment_method: 'cash',
          notes: '',
          admin_notes: ''
        });

        loadInitialData();

        // Ask for print with enhanced details
        if (confirm('Billing completed! Would you like to print the detailed bill?')) {
          let sessionOrders = [];

          if (billingTable.session_orders) {
            sessionOrders = billingTable.session_orders;
          } else if (billingTable.active_orders) {
            sessionOrders = billingTable.active_orders;
          } else {
            try {
              const sessionResponse = await makeAuthenticatedRequest(`/api/restaurant/tables/${billingTable.id}/session_orders/`);
              if (sessionResponse && sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                sessionOrders = sessionData.orders || [];
              }
            } catch (error) {
              console.error('Could not get session orders:', error);
              sessionOrders = [];
            }
          }

          console.log('🧾 Printing orders for table:', sessionOrders);
          await printDetailedBill(result, billingTable.table_number, sessionOrders);
        }
      } else {
        const error = await response.json();
        toast.error(`❌ Failed to complete billing: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error completing billing:', error);
      toast.error('❌ Network error during billing');
    }
  };

  // Menu Functions
  const loadMenuItems = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/restaurant/menu-for-ordering/');

      if (response && response.ok) {
        const menuData = await response.json();
        console.log('🔍 Menu data loaded:', menuData);
        setMenuItems(menuData);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error('Failed to load menu items');
    }
  };

  const openAddOrderModal = (table) => {
    setOrderingTable(table);
    setShowAddOrderModal(true);
    setSelectedMenuItems([]);
    setSearchQuery('');
    loadMenuItems();
  };

  const addItemToOrder = (item) => {
    const existingItem = selectedMenuItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedMenuItems(prev => prev.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedMenuItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const placeOrderForTable = async () => {
    if (!orderingTable || selectedMenuItems.length === 0) {
      toast.error('Please select items to order');
      return;
    }

    try {
      const orders = selectedMenuItems.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        special_instructions: ''
      }));

      const response = await makeAuthenticatedRequest('/api/restaurant/orders/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({
          table: orderingTable.id,
          orders: orders
        })
      });

      if (response && response.ok) {
        toast.success(`Order placed for Table ${orderingTable.table_number}`);
        setShowAddOrderModal(false);
        loadInitialData();
      } else {
        const error = await response.json();
        toast.error(`Failed to place order: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Network error while placing order');
    }
  };

  // Enhanced Bill Printing Function - Keep existing
  const printDetailedBill = async (session, tableNumber, orders) => {
    try {
      const now = new Date();
      const billDate = now.toLocaleDateString('en-IN');
      const billTime = now.toLocaleTimeString('en-IN');

      const subtotal = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
      const discountAmount = parseFloat(session.discount_amount || 0);
      const serviceCharge = parseFloat(session.service_charge || 0);
      const taxableAmount = subtotal - discountAmount;

      const gstRate = 18;
      const gstAmount = (taxableAmount * gstRate) / 100;
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;
      const finalTotal = taxableAmount + gstAmount + serviceCharge;

      const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - ${session.receipt_number || 'BILL'}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .bill-container {
            max-width: 300px;
            margin: 0 auto;
            border: 1px solid #000;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .hotel-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .bill-title {
            font-size: 14px;
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
            font-size: 14px;
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
          <!-- Header Section -->
          <div class="header">
            <div class="hotel-name">HOTEL RESTAURANT</div>
            <div>Complete Dining Experience</div>
            <div style="font-size: 10px; margin-top: 5px;">
              GSTIN: 27ABCDE1234F1Z5 | FSSAI: 12345678901234
            </div>
          </div>

          <!-- Bill Details -->
          <div class="bill-title">TAX INVOICE</div>

          <div class="row">
            <span>Receipt #:</span>
            <span><strong>${session.receipt_number || 'N/A'}</strong></span>
          </div>
          <div class="row">
            <span>Table:</span>
            <span><strong>${tableNumber}</strong></span>
          </div>
          <div class="row">
            <span>Date:</span>
            <span>${billDate}</span>
          </div>
          <div class="row">
            <span>Time:</span>
            <span>${billTime}</span>
          </div>

          <!-- Customer Details -->
          <div class="divider"></div>
          <div><strong>Customer Details:</strong></div>
          <div class="row">
            <span>Name:</span>
            <span>${billingData?.customer_name || session?.customer_name || 'Guest'}</span>
          </div>
          ${(billingData?.customer_phone || session?.customer_phone) ? `
          <div class="row">
            <span>Phone:</span>
            <span>${billingData.customer_phone || session.customer_phone}</span>
          </div>` : ''}

          <!-- Order Details -->
          <div class="divider"></div>
          <div><strong>Order Details:</strong></div>

          ${orders.map(order => `
            <div class="item-row">
              <div class="item-name">${order.menu_item_name}</div>
              <div class="item-details">
                ${order.quantity} x ₹${parseFloat(order.unit_price || 0).toFixed(2)} = ₹${parseFloat(order.total_price || 0).toFixed(2)}
              </div>
              ${order.special_instructions ? `
              <div class="item-details" style="font-style: italic;">
                Note: ${order.special_instructions}
              </div>` : ''}
            </div>
          `).join('')}

          <!-- Billing Summary -->
          <div class="total-section">
            <div class="row">
              <span>Subtotal (${orders.length} items):</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>

            ${discountAmount > 0 ? `
            <div class="row">
              <span>Discount:</span>
              <span>-₹${discountAmount.toFixed(2)}</span>
            </div>` : ''}

            <div class="row">
              <span>Taxable Amount:</span>
              <span>₹${taxableAmount.toFixed(2)}</span>
            </div>

            <!-- GST Breakdown -->
            <div class="gst-section">
              <div><strong>GST Breakdown (${gstRate}%):</strong></div>
              <div class="row">
                <span>CGST (${gstRate / 2}%):</span>
                <span>₹${cgstAmount.toFixed(2)}</span>
              </div>
              <div class="row">
                <span>SGST (${gstRate / 2}%):</span>
                <span>₹${sgstAmount.toFixed(2)}</span>
              </div>
              <div class="row">
                <span>Total GST:</span>
                <span>₹${gstAmount.toFixed(2)}</span>
              </div>
            </div>

            ${serviceCharge > 0 ? `
            <div class="row">
              <span>Service Charge:</span>
              <span>₹${serviceCharge.toFixed(2)}</span>
            </div>` : ''}

            <div class="grand-total row">
              <span>TOTAL AMOUNT:</span>
              <span>₹${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="divider"></div>
          <div class="row">
            <span>Payment Mode:</span>
            <span><strong>${(billingData?.payment_method || session?.payment_method || 'cash').toUpperCase()}</strong></span>
          </div>
          <div style="text-align: center; margin: 10px 0;">
            <strong>PAID</strong>
          </div>

          ${(billingData?.notes || session?.notes) ? `
          <div class="divider"></div>
          <div><strong>Notes:</strong></div>
          <div style="font-size: 11px;">${billingData.notes || session.notes}</div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div>Visit again soon!</div>
            <div style="margin-top: 10px; font-size: 10px;">
              Generated by: ${user?.email || 'System'} | ${billTime}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast.success('✅ Detailed bill sent to printer');
    } catch (error) {
      console.error('Error printing detailed bill:', error);
      toast.error('❌ Failed to print detailed bill');
    }
  };

  // Utility Functions
  const getTableStatusColor = (status) => {
    const colors = {
      free: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-red-100 text-red-800 border-red-200',
      reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cleaning: 'bg-blue-100 text-blue-800 border-blue-200',
      maintenance: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.free;
  };

  const getTableStatusIcon = (status) => {
    const icons = {
      free: '✅',
      occupied: '👥',
      reserved: '📅',
      cleaning: '🧹',
      maintenance: '🔧'
    };
    return icons[status] || '❓';
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Check permissions
  const canCreateTables = ['admin', 'manager'].includes(user?.role);
  const canEditTables = ['admin', 'manager'].includes(user?.role);
  const canDeleteTables = user?.role === 'admin';

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading table management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ENHANCED HEADER WITH HOME BUTTON + ADVANCED BOOKING LINK */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🏪 Table Management Dashboard</h1>
            <div className="flex items-center space-x-4">
              {/* HOME BUTTON - PROPERLY POSITIONED */}
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🏠 Home
              </Link>

              <span className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>

              <div className="flex space-x-2">
                {canCreateTables && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Add Table
                  </button>
                )}

                {/* ADVANCED BOOKING LINK - ADMIN ONLY */}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/bookings"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    📅 Advanced Booking
                  </Link>
                )}

                <Link
                  href="/admin/mobile-ordering"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📱 Mobile Ordering
                </Link>

                <Link
                  href="/kitchen"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  🍳 Kitchen Display
                </Link>

                <button
                  onClick={loadInitialData}
                  disabled={refreshing}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {refreshing ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* BOOKING NOTIFICATIONS - SHOWS ON ALL ROLE PAGES */}
        <BookingNotifications bookings={bookings} />

        {/* ERROR STATE HANDLING */}
        {error && !loading && (
          <ErrorBoundary
            error={error}
            onRetry={() => {
              setError(null);
              loadInitialData();
            }}
            onHome={() => window.location.href = '/admin/dashboard'}
          />
        )}

        {/* LOADING STATE */}
        {refreshing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Refreshing tables...</p>
          </div>
        )}

        {/* DASHBOARD STATS */}
        {!error && !loading && dashboardStats.tables && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Free Tables</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.tables.free}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.tables.occupied}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">#</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.orders?.preparing || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.revenue?.today || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && !loading && tables.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tables found</h2>
            <p className="text-gray-600 mb-6">No tables are currently configured for this restaurant.</p>
            
            <div className="space-x-4">
              <button
                onClick={loadInitialData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                🔄 Refresh Data
              </button>
              
              {canCreateTables && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  ➕ Add Your First Table
                </button>
              )}
            </div>
          </div>
        )}

        {/* TABLES GRID - Only show if we have data and no errors */}
        {!error && !loading && tables.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map(table => (
              <div
                key={table.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTable(table)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Table {table.table_number}</h3>
                    <div className="text-sm text-gray-600">
                      Capacity: {table.capacity} people
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    {canEditTables && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTable(table);
                          setEditTableData({
                            table_number: table.table_number,
                            capacity: table.capacity,
                            location: table.location || '',
                            status: table.status,
                            priority_level: table.priority_level || 1,
                            notes: table.notes || ''
                          });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {canDeleteTables && table.status === 'free' && table.active_orders_count === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTable(table);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-3 ${getTableStatusColor(table.status)}`}>
                    <span className="mr-1">{getTableStatusIcon(table.status)}</span>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </div>

                  {/* Active Orders */}
                  {table.active_orders && table.active_orders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Active Orders ({table.active_orders.length}):
                      </p>
                      {table.active_orders.slice(0, 3).map((order, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          <span className="font-medium">{order.menu_item_name} x{order.quantity}</span>
                          <span className={`ml-2 px-2 py-1 rounded ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                            order.status === 'ready' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      ))}
                      {table.active_orders.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{table.active_orders.length - 3} more orders
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bill Amount */}
                  {table.total_bill_amount > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Bill: {formatCurrency(table.total_bill_amount)}
                    </p>
                  )}

                  {/* Occupancy Duration */}
                  {table.time_occupied > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Occupied for: {formatDuration(table.time_occupied)}
                    </p>
                  )}

                  {/* Location */}
                  {table.location && (
                    <p className="text-sm text-gray-600 mb-3">
                      📍 {table.location}
                    </p>
                  )}

                  {/* Quick Actions */}
                  {table.status === 'occupied' && (
                    <div className="flex space-x-2">
                      {user?.role === 'admin' && table.active_orders_count > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderManagement(table);
                          }}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          🔧 Manage
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddOrderModal(table);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        + Order
                      </button>

                      {table.can_bill && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTableForBilling(table);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          💳 Bill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ALL EXISTING MODALS - KEEPING THEM EXACTLY AS THEY ARE */}
      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Table</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
                <input
                  type="text"
                  required
                  value={newTableData.table_number}
                  onChange={(e) => setNewTableData({
                    ...newTableData,
                    table_number: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., T1, A1, VIP1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTableData.capacity}
                  onChange={(e) => setNewTableData({
                    ...newTableData,
                    capacity: parseInt(e.target.value) || 4
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newTableData.location}
                  onChange={(e) => setNewTableData({
                    ...newTableData,
                    location: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Main Hall, Terrace, VIP Section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                <select
                  value={newTableData.status}
                  onChange={(e) => setNewTableData({
                    ...newTableData,
                    status: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newTableData.notes}
                  onChange={(e) => setNewTableData({
                    ...newTableData,
                    notes: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Optional notes about this table"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTableData({
                    table_number: '',
                    capacity: 4,
                    location: '',
                    status: 'free',
                    priority_level: 1,
                    notes: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL OTHER EXISTING MODALS GO HERE - KEEPING THEM EXACTLY AS BEFORE */}
      {/* Edit Modal, Delete Modal, Billing Modal, etc. - All preserved exactly */}

      {/* Edit Table Modal */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Table {editingTable.table_number}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
                <input
                  type="text"
                  required
                  value={editTableData.table_number}
                  onChange={(e) => setEditTableData({
                    ...editTableData,
                    table_number: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={editTableData.capacity}
                  onChange={(e) => setEditTableData({
                    ...editTableData,
                    capacity: parseInt(e.target.value) || 4
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editTableData.location}
                  onChange={(e) => setEditTableData({
                    ...editTableData,
                    location: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editTableData.status}
                  onChange={(e) => setEditTableData({
                    ...editTableData,
                    status: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={editingTable.status === 'occupied'}
                >
                  <option value="free">Free</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                {editingTable.status === 'occupied' && (
                  <p className="text-sm text-red-600 mt-1">
                    Cannot change status of occupied table with active orders
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editTableData.notes}
                  onChange={(e) => setEditTableData({
                    ...editTableData,
                    notes: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editTable}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Table</h2>

            <div className="mb-4">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">⚠️</span>
                <p>Are you sure you want to delete <strong>Table {deletingTable.table_number}</strong>?</p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. The table will be permanently removed from the system.
              </p>

              {deletingTable.active_orders_count > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-red-800 text-sm">
                    ⚠️ This table has {deletingTable.active_orders_count} active orders. Please complete or cancel all orders before deleting.
                  </p>
                </div>
              )}

              {deletingTable.status === 'occupied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-red-800 text-sm">
                    ⚠️ This table is currently occupied. Please free the table before deleting.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingTable(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteTable}
                disabled={deletingTable.active_orders_count > 0 || deletingTable.status === 'occupied'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING MODAL - Uses dedicated component with error handling */}
      {showBillModal && billingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">💳 Complete Billing - Table {billingTable.table_number}</h2>

            {/* Use the dedicated billing orders component with error handling */}
            <BillingOrdersSection tableId={billingTable.id} />

            {/* Customer Details Form */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={billingData.customer_name}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      customer_name: e.target.value
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={billingData.customer_phone}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      customer_phone: e.target.value
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Billing Adjustments */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Billing Adjustments</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.discount_amount}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      discount_amount: parseFloat(e.target.value) || 0
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={billingData.discount_percentage}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      discount_percentage: parseFloat(e.target.value) || 0
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.service_charge}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      service_charge: parseFloat(e.target.value) || 0
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={billingData.payment_method}
                onChange={(e) => setBillingData({
                  ...billingData,
                  payment_method: e.target.value
                })}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
                <option value="online">🌐 Online</option>
                <option value="mixed">🔄 Mixed Payment</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                  <textarea
                    value={billingData.notes}
                    onChange={(e) => setBillingData({
                      ...billingData,
                      notes: e.target.value
                    })}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Optional notes for customer"
                  />
                </div>

                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Internal)</label>
                    <textarea
                      value={billingData.admin_notes}
                      onChange={(e) => setBillingData({
                        ...billingData,
                        admin_notes: e.target.value
                      })}
                      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Internal admin notes"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setBillingTable(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={completeBilling}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                💳 Complete Billing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Detail Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Table {selectedTable.table_number} Details</h2>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Table Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <p className="text-lg">{selectedTable.capacity} people</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTableStatusColor(selectedTable.status)}`}>
                  {getTableStatusIcon(selectedTable.status)} {selectedTable.status.charAt(0).toUpperCase() + selectedTable.status.slice(1)}
                </div>
              </div>

              {selectedTable.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-lg">{selectedTable.location}</p>
                </div>
              )}

              {selectedTable.time_occupied > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupied Time</label>
                  <p className="text-lg">{formatDuration(selectedTable.time_occupied)}</p>
                </div>
              )}
            </div>

            {/* Active Orders */}
            {selectedTable.active_orders && selectedTable.active_orders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Active Orders ({selectedTable.active_orders.length})</h3>
                <div className="space-y-3">
                  {selectedTable.active_orders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{order.menu_item_name}</h4>
                        <span className={`px-2 py-1 rounded text-sm ${getTableStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Quantity: {order.quantity} • Order: {order.order_number}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-gray-600">Created by: {order.created_by_name}</span>
                        <span className="font-medium">Amount: {formatCurrency(order.total_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Information */}
            {selectedTable.total_bill_amount > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Current Bill</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-center">{formatCurrency(selectedTable.total_bill_amount)}</p>
                  {selectedTable.status === 'occupied' && (
                    <button
                      onClick={() => {
                        setSelectedTable(null);
                        selectTableForBilling(selectedTable);
                      }}
                      className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Billing
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedTable(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && orderingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Order - Table {orderingTable.table_number}</h2>
              <button
                onClick={() => setShowAddOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Menu Items */}
            <div className="mb-6">
              {menuItems.length === 0 ? (
                <div className="text-center py-8">Loading menu items...</div>
              ) : (
                menuItems.filter(category =>
                  category.items && category.items.some(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                ).map(category => (
                  <div key={category.id} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{category.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items
                        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => addItemToOrder(item)}
                            className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="font-bold">₹{item.price}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Selected Items ({selectedMenuItems.length})</h3>
              <div className="space-y-2">
                {selectedMenuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>{item.name}</span>
                    <span>₹{item.price} x {item.quantity}</span>
                    <button
                      onClick={() => setSelectedMenuItems(prev => prev.filter(selected => selected.id !== item.id))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {selectedMenuItems.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-lg font-bold text-right">
                      Total: ₹{selectedMenuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddOrderModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={placeOrderForTable}
                disabled={selectedMenuItems.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Order Management Modal */}
      <AdminOrderManagement
        table={managingTable}
        isOpen={showOrderManagement}
        onClose={() => setShowOrderManagement(false)}
        onOrdersUpdated={loadInitialData}
      />
    </div>
  );
}

export default withRoleGuard(TableManagementDashboard, ['admin', 'staff']);
