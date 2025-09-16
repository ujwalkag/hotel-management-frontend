// pages/admin/table-management.js - Table Management Dashboard
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function TableManagementDashboard() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // ✅ NEW: CRUD Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);
  
  // ✅ NEW: Form States
  const [newTableData, setNewTableData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    status: 'free'
  });
  
  const [editTableData, setEditTableData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    status: 'free'
  });
  
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    loadInitialData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/table-management/`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Table Management WebSocket connected');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

    } catch (error) {
      console.error('Error connecting WebSocket:', error);
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
        toast.info(`Table removed from system`);
        break;

      case 'new_order':
        setTables(prev => prev.map(table =>
          table.id === data.table_id
            ? { ...table, active_orders_count: data.order_count }
            : table
        ));
        break;
    }
  };

  const loadInitialData = async () => {
    try {
      const [tablesRes, statsRes] = await Promise.all([
        fetch('/api/restaurant/tables/with_orders/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        fetch('/api/restaurant/dashboard-stats/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        })
      ]);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Create Table Function
  const createTable = async () => {
    try {
      // Validation
      if (!newTableData.table_number.trim()) {
        toast.error('Please enter a table number');
        return;
      }

      if (newTableData.capacity < 1 || newTableData.capacity > 20) {
        toast.error('Table capacity must be between 1 and 20');
        return;
      }

      // Check if table number already exists
      if (tables.some(table => table.table_number === newTableData.table_number)) {
        toast.error('Table number already exists');
        return;
      }

      const response = await fetch('/api/restaurant/tables/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify(newTableData)
      });

      if (response.ok) {
        const newTable = await response.json();
        setTables(prev => [...prev, newTable]);
        setShowCreateModal(false);
        setNewTableData({
          table_number: '',
          capacity: 4,
          location: '',
          status: 'free'
        });
        toast.success(`Table ${newTable.table_number} created successfully!`);
        loadInitialData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to create table: ${error.detail || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Network error while creating table');
    }
  };

  // ✅ NEW: Edit Table Function
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

      // Check if table number conflicts with other tables
      if (tables.some(table => 
        table.table_number === editTableData.table_number && 
        table.id !== editingTable.id
      )) {
        toast.error('Table number already exists');
        return;
      }

      const response = await fetch(`/api/restaurant/tables/${editingTable.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify(editTableData)
      });

      if (response.ok) {
        const updatedTable = await response.json();
        setTables(prev => prev.map(table => 
          table.id === editingTable.id ? updatedTable : table
        ));
        setShowEditModal(false);
        setEditingTable(null);
        toast.success(`Table ${updatedTable.table_number} updated successfully!`);
        loadInitialData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to update table: ${error.detail || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Network error while updating table');
    }
  };

  // ✅ NEW: Delete Table Function  
  const deleteTable = async () => {
    try {
      // Check if table has active orders
      if (deletingTable.active_orders_count > 0) {
        toast.error('Cannot delete table with active orders');
        return;
      }

      // Check if table is occupied
      if (deletingTable.status === 'occupied') {
        toast.error('Cannot delete occupied table');
        return;
      }

      const response = await fetch(`/api/restaurant/tables/${deletingTable.id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.access}`
        }
      });

      if (response.ok) {
        setTables(prev => prev.filter(table => table.id !== deletingTable.id));
        setShowDeleteModal(false);
        setDeletingTable(null);
        toast.success(`Table ${deletingTable.table_number} deleted successfully!`);
        loadInitialData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to delete table: ${error.detail || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Network error while deleting table');
    }
  };

  // ✅ NEW: Open Edit Modal
  const openEditModal = (table) => {
    setEditingTable(table);
    setEditTableData({
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location || '',
      status: table.status
    });
    setShowEditModal(true);
  };

  // ✅ NEW: Open Delete Modal
  const openDeleteModal = (table) => {
    setDeletingTable(table);
    setShowDeleteModal(true);
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const response = await fetch(`/api/restaurant/tables/${tableId}/change_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Table status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update table status');
      }

    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Network error');
    }
  };

  const completeBilling = async (tableId) => {
    try {
      const response = await fetch(`/api/restaurant/tables/${tableId}/complete_billing/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Billing completed. Amount: ₹${result.final_amount}`);
        setSelectedTable(null);
        loadInitialData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to complete billing: ${error.error}`);
      }

    } catch (error) {
      console.error('Error completing billing:', error);
      toast.error('Network error');
    }
  };

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

  // ✅ NEW: Check permissions
  const canCreateTables = ['admin', 'manager'].includes(user?.role);
  const canEditTables = ['admin', 'manager'].includes(user?.role);
  const canDeleteTables = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading table management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏪 Table Management Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* ✅ NEW: Create Table Button */}
              {canCreateTables && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Table</span>
                </button>
              )}

              <Link href="/admin/mobile-ordering">
                <span className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 cursor-pointer">
                  <span>📱</span>
                  <span>Mobile Ordering</span>
                </span>
              </Link>
              
              <Link href="/admin/kds">
                <span className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 cursor-pointer">
                  <span>🍳</span>
                  <span>Kitchen Display</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats.tables && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="text-green-600 font-semibold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Free Tables</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {dashboardStats.tables.free}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <span className="text-red-600 font-semibold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Occupied</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {dashboardStats.tables.occupied}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {dashboardStats.orders?.preparing || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(dashboardStats.revenue?.today || 0)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTable(table)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Table {table.table_number}</h3>
                    <p className="text-sm text-gray-500">
                      Capacity: {table.capacity} people
                    </p>
                  </div>

                  {/* ✅ NEW: Action Buttons */}
                  <div className="flex space-x-2">
                    {canEditTables && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(table);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit Table"
                      >
                        ✏️
                      </button>
                    )}
                    {canDeleteTables && table.status === 'free' && table.active_orders_count === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(table);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Table"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                    <span className="mr-1">{getTableStatusIcon(table.status)}</span>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </span>
                </div>

                {table.active_orders && table.active_orders.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Active Orders ({table.active_orders.length}):
                    </p>
                    {table.active_orders.slice(0, 3).map((order, index) => (
                      <div key={index} className="text-xs text-gray-600 mb-1 flex justify-between">
                        <span>{order.menu_item_name} x{order.quantity}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
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

                {table.total_bill_amount > 0 && (
                  <p className="text-sm text-blue-600 font-medium mb-2">
                    Bill: {formatCurrency(table.total_bill_amount)}
                  </p>
                )}

                {table.time_occupied > 0 && (
                  <p className="text-xs text-gray-500 mb-2">
                    Occupied for: {formatDuration(table.time_occupied)}
                  </p>
                )}

                {table.location && (
                  <p className="text-xs text-gray-500">
                    📍 {table.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ NEW: Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Table</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTableData.capacity}
                    onChange={(e) => setNewTableData({
                      ...newTableData,
                      capacity: parseInt(e.target.value) || 4
                    })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Status
                  </label>
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
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createTable}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Create Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Edit Table Modal */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Table {editingTable.table_number}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={editTableData.table_number}
                    onChange={(e) => setEditTableData({
                      ...editTableData,
                      table_number: e.target.value
                    })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., T1, A1, VIP1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editTableData.capacity}
                    onChange={(e) => setEditTableData({
                      ...editTableData,
                      capacity: parseInt(e.target.value) || 4
                    })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editTableData.location}
                    onChange={(e) => setEditTableData({
                      ...editTableData,
                      location: e.target.value
                    })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Hall, Terrace, VIP Section"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
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
                    <p className="text-xs text-amber-600 mt-1">
                      Cannot change status of occupied table with active orders
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editTable}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Delete Confirmation Modal */}
      {showDeleteModal && deletingTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Table</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <p className="text-sm text-gray-500 text-center mb-2">
                  Are you sure you want to delete <strong>Table {deletingTable.table_number}</strong>?
                </p>
                
                <p className="text-xs text-red-600 text-center">
                  This action cannot be undone. The table will be permanently removed from the system.
                </p>

                {deletingTable.active_orders_count > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ This table has {deletingTable.active_orders_count} active orders. Please complete or cancel all orders before deleting.
                    </p>
                  </div>
                )}

                {deletingTable.status === 'occupied' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ This table is currently occupied. Please free the table before deleting.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTable}
                  disabled={deletingTable.active_orders_count > 0 || deletingTable.status === 'occupied'}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Delete Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Detail Modal (existing functionality) */}
      {selectedTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Table {selectedTable.table_number} Details
                </h3>
                <div className="text-sm text-gray-500">
                  Capacity: {selectedTable.capacity} people
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Current Status */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Current Status</h4>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTableStatusColor(selectedTable.status)}`}>
                    {getTableStatusIcon(selectedTable.status)} {selectedTable.status.charAt(0).toUpperCase() + selectedTable.status.slice(1)}
                  </span>
                  {selectedTable.status !== 'maintenance' && (
                    <select
                      value={selectedTable.status}
                      onChange={(e) => updateTableStatus(selectedTable.id, e.target.value)}
                      className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Active Orders */}
              {selectedTable.active_orders && selectedTable.active_orders.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Active Orders ({selectedTable.active_orders.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedTable.active_orders.map((order, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{order.menu_item_name}</h5>
                            <p className="text-sm text-gray-600">
                              Quantity: {order.quantity} • Order: {order.order_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'ready' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Created by: {order.created_by_name} • 
                          Amount: {formatCurrency(order.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Information */}
              {selectedTable.total_bill_amount > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Current Bill</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-3">
                    {formatCurrency(selectedTable.total_bill_amount)}
                  </div>
                  {selectedTable.status === 'occupied' && (
                    <button
                      onClick={() => completeBilling(selectedTable.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Billing & Free Table
                    </button>
                  )}
                </div>
              )}

              {/* Table Information */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Table Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Capacity:</span>
                    <span className="ml-2 text-gray-900">{selectedTable.capacity} people</span>
                  </div>
                  {selectedTable.location && (
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-900">{selectedTable.location}</span>
                    </div>
                  )}
                  {selectedTable.time_occupied > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Occupied Time:</span>
                      <span className="ml-2 text-gray-900">{formatDuration(selectedTable.time_occupied)}</span>
                    </div>
                  )}
                  {selectedTable.last_order_time && (
                    <div>
                      <span className="font-medium text-gray-700">Last Order:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedTable.last_order_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Link href={`/admin/mobile-ordering?table=${selectedTable.id}`}>
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2">
                    <span>📱</span>
                    <span>Add Order</span>
                  </span>
                </Link>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(TableManagementDashboard, ['admin', 'manager']);
