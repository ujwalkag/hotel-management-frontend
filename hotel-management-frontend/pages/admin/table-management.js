// pages/admin/table-management.js - Enhanced Table Management with Complete Functionality
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminOrderManagement from '../../components/AdminOrderManagement';

function TableManagementDashboard() {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Enhanced CRUD Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [deletingTable, setDeletingTable] = useState(null);
    const [billingTable, setBillingTable] = useState(null);

    // Admin Order Management States - ADDED
    const [showOrderManagement, setShowOrderManagement] = useState(false);
    const [managingTable, setManagingTable] = useState(null);

    // Enhanced Form States
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
        discount_amount: 0,
        discount_percentage: 0,
        service_charge: 0,
        payment_method: 'cash',
        notes: '',
        admin_notes: ''
    });

    // Admin Order Management Function - ADDED
    const openOrderManagement = (table) => {
        setManagingTable(table);
        setShowOrderManagement(true);
    };

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

    const connectWebSocket = () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/table-management/`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                console.log('Table Management WebSocket connected');

                // Clear any pending reconnection
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                console.log('Table Management WebSocket disconnected');

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            wsRef.current.onmessage = (event) => {
                handleWebSocketMessage(JSON.parse(event.data));
            };

        } catch (error) {
            console.error('Error connecting WebSocket:', error);
            // Fallback to polling if WebSocket fails
            setTimeout(loadInitialData, 5000);
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

    const loadInitialData = async () => {
        try {
            setRefreshing(true);

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
            } else {
                throw new Error('Failed to load tables');
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
            setRefreshing(false);
        }
    };

    // Enhanced Create Table Function
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
                    status: 'free',
                    priority_level: 1,
                    notes: ''
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

    // Enhanced Edit Table Function
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

    // Enhanced Delete Table Function
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

    // Enhanced Billing Function
    const completeBilling = async () => {
        try {
            if (!billingTable) return;

            const response = await fetch(`/api/restaurant/tables/${billingTable.id}/complete_billing/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`
                },
                body: JSON.stringify(billingData)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(`Billing completed. Amount: ₹${result.final_amount}`);

                // Update table status
                setTables(prev => prev.map(table =>
                    table.id === billingTable.id
                        ? { ...table, status: 'free', active_orders_count: 0 }
                        : table
                ));

                setShowBillModal(false);
                setBillingTable(null);
                setBillingData({
                    discount_amount: 0,
                    discount_percentage: 0,
                    service_charge: 0,
                    payment_method: 'cash',
                    notes: '',
                    admin_notes: ''
                });

                loadInitialData();
            } else {
                const error = await response.json();
                toast.error(`Failed to complete billing: ${error.error}`);
            }

        } catch (error) {
            console.error('Error completing billing:', error);
            toast.error('Network error during billing');
        }
    };

    // Print Bill Function - FIXED
    const printBill = async (table) => {
        try {
            const response = await fetch(`/api/restaurant/tables/${table.id}/print_bill/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`
                }
            });

            if (response.ok) {
                const result = await response.json();

                // FIXED: Check if bill_data and receipt_number exist before accessing
                if (result.bill_data && result.bill_data.receipt_number) {
                    const billData = result.bill_data;
                    const printContent = generatePrintContent(billData);

                    // Open print dialog
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.print();

                    toast.success('✅ Bill sent to printer');
                } else {
                    toast.error('❌ Bill data not available for printing');
                    console.error('Bill data missing or incomplete:', result);
                }
            } else {
                const error = await response.json();
                toast.error(`❌ Failed to print bill: ${error.error || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Error printing bill:', error);
            toast.error('❌ Failed to print bill');
        }
    };

    // FIXED: Generate print content with proper error handling
    const generatePrintContent = (billData) => {
        try {
            // Ensure billData has all required fields
            const receiptNumber = billData.receipt_number || 'N/A';
            const tableNumber = billData.table_number || 'N/A';
            const dateTime = billData.date_time || new Date().toLocaleString();
            const orders = billData.orders || [];
            const subtotal = billData.subtotal || 0;
            const discount = billData.discount || 0;
            const tax = billData.tax || 0;
            const serviceCharge = billData.service_charge || 0;
            const finalAmount = billData.final_amount || 0;
            const servedBy = billData.served_by || 'System';

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bill - ${receiptNumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; margin: 20px; }
                        .receipt { max-width: 300px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total-row { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <h2>Hotel Management Restaurant</h2>
                            <p>Receipt: ${receiptNumber}</p>
                            <p>Table: ${tableNumber}</p>
                            <p>Date: ${dateTime}</p>
                        </div>
                        <div class="items">
                            ${orders.map(order => `
                                <div class="item-row">
                                    <span>${order.item_name || 'Item'} x${order.quantity || 1}</span>
                                    <span>₹${(order.total_price || 0).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div class="totals">
                            <hr>
                            <div class="item-row">
                                <span>Subtotal:</span>
                                <span>₹${subtotal.toFixed(2)}</span>
                            </div>
                            <div class="item-row">
                                <span>Discount:</span>
                                <span>-₹${discount.toFixed(2)}</span>
                            </div>
                            <div class="item-row">
                                <span>Tax:</span>
                                <span>₹${tax.toFixed(2)}</span>
                            </div>
                            <div class="item-row">
                                <span>Service Charge:</span>
                                <span>₹${serviceCharge.toFixed(2)}</span>
                            </div>
                            <div class="item-row total-row">
                                <span>Total:</span>
                                <span>₹${finalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 20px;">
                            <p>Thank you for dining with us!</p>
                            <p>Served by: ${servedBy}</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
        } catch (error) {
            console.error('Error generating print content:', error);
            return `
                <html><body>
                    <h2>Hotel Management Restaurant</h2>
                    <p>Error generating bill content</p>
                    <p>Please try again or contact support</p>
                </body></html>
            `;
        }
    };

    // Utility functions
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Loading table management...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🏪 Table Management Dashboard
                            </h1>
                            <div className="flex items-center space-x-4 mt-2">
                                {/* Connection Status */}
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isConnected
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Create Table Button */}
                            {canCreateTables && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    ➕ Add Table
                                </button>
                            )}

                            <Link href="/admin/mobile-ordering" legacyBehavior>
                                <a className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    📱 Mobile Ordering
                                </a>
                            </Link>

                            <Link href="/admin/kitchen-display" legacyBehavior>
                                <a className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                                    🍳 Kitchen Display
                                </a>
                            </Link>

                            <button
                                onClick={loadInitialData}
                                disabled={refreshing}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                {dashboardStats.tables && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="text-3xl text-green-500">✅</div>
                                <div className="ml-4">
                                    <p className="text-gray-500">Free Tables</p>
                                    <p className="text-2xl font-semibold">{dashboardStats.tables.free}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="text-3xl text-red-500">👥</div>
                                <div className="ml-4">
                                    <p className="text-gray-500">Occupied</p>
                                    <p className="text-2xl font-semibold">{dashboardStats.tables.occupied}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="text-3xl text-blue-500">#</div>
                                <div className="ml-4">
                                    <p className="text-gray-500">Active Orders</p>
                                    <p className="text-2xl font-semibold">{dashboardStats.orders?.preparing || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="text-3xl text-green-500">💰</div>
                                <div className="ml-4">
                                    <p className="text-gray-500">Today's Revenue</p>
                                    <p className="text-2xl font-semibold">{formatCurrency(dashboardStats.revenue?.today || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tables Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedTable(table)}
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Table {table.table_number}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Capacity: {table.capacity} people
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-1">
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
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit table"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                        {canDeleteTables && table.status === 'free' && table.active_orders_count === 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingTable(table);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete table"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTableStatusColor(table.status)} mb-3`}>
                                    <span className="mr-1">{getTableStatusIcon(table.status)}</span>
                                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                </div>

                                {/* Active Orders */}
                                {table.active_orders && table.active_orders.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Active Orders ({table.active_orders.length}):
                                        </p>
                                        {table.active_orders.slice(0, 3).map((order, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm mb-1">
                                                <span className="text-gray-600">
                                                    {order.menu_item_name} x{order.quantity}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs ${getTableStatusColor(order.status)}`}>
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
                                    <p className="text-sm text-green-600 font-medium mb-2">
                                        Bill: {formatCurrency(table.total_bill_amount)}
                                    </p>
                                )}

                                {/* Occupancy Duration */}
                                {table.time_occupied > 0 && (
                                    <p className="text-xs text-gray-500 mb-2">
                                        Occupied for: {formatDuration(table.time_occupied)}
                                    </p>
                                )}

                                {/* Location */}
                                {table.location && (
                                    <p className="text-xs text-gray-500 mb-2">
                                        📍 {table.location}
                                    </p>
                                )}

                                {/* Quick Actions - FIXED to show billing options for tables with served orders */}
                                {((table.status === 'occupied' && table.active_orders_count > 0) || 
                                  (table.has_served_orders && table.total_bill_amount > 0)) && (
                                    <div className="mt-3 pt-3 border-t flex space-x-2">
                                        {/* Admin Manage Orders Button - Only for tables with active orders */}
                                        {user?.role === 'admin' && table.active_orders_count > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openOrderManagement(table);
                                                }}
                                                className="flex-1 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                                                title="Manage Orders (Admin)"
                                            >
                                                📝 Manage
                                            </button>
                                        )}
                                        
                                        {/* Billing Button - Show for any table with billable orders */}
                                        {(table.can_bill || table.total_bill_amount > 0) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBillingTable(table);
                                                    setShowBillModal(true);
                                                }}
                                                className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                            >
                                                💳 Bill
                                            </button>
                                        )}
                                        
                                        {/* Print Button - Show for any table with orders */}
                                        {table.total_bill_amount > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    printBill(table);
                                                }}
                                                className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                            >
                                                🖨️ Print
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {tables.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🏪</div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Tables Found</h3>
                        <p className="text-gray-500 mb-6">Get started by adding your first table.</p>
                        {canCreateTables && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                ➕ Add Your First Table
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Table Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Create New Table</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Table Number *
                                </label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity *
                                </label>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
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

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTable}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Create Table
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {showEditModal && editingTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Edit Table {editingTable.table_number}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Table Number *
                                </label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity *
                                </label>
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
                                    <p className="text-sm text-red-600 mt-1">
                                        Cannot change status of occupied table with active orders
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
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

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editTable}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Table</h3>

                        <div className="mb-4">
                            <div className="flex items-center mb-4">
                                <div className="text-red-500 text-4xl mr-4">⚠️</div>
                                <div>
                                    <p className="font-medium">Are you sure you want to delete <strong>Table {deletingTable.table_number}</strong>?</p>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4">
                                This action cannot be undone. The table will be permanently removed from the system.
                            </p>

                            {deletingTable.active_orders_count > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                                    <p className="text-red-800 text-sm">
                                        ⚠️ This table has {deletingTable.active_orders_count} active orders. Please complete or cancel all orders before deleting.
                                    </p>
                                </div>
                            )}

                            {deletingTable.status === 'occupied' && (
                                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                                    <p className="text-red-800 text-sm">
                                        ⚠️ This table is currently occupied. Please free the table before deleting.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteTable}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                disabled={deletingTable.active_orders_count > 0 || deletingTable.status === 'occupied'}
                            >
                                Delete Table
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Modal */}
            {showBillModal && billingTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            Complete Billing - Table {billingTable.table_number}
                        </h3>

                        <div className="space-y-4">
                            {/* Current Total */}
                            <div className="bg-gray-50 p-4 rounded">
                                <div className="text-2xl font-bold text-center">
                                    {formatCurrency(billingTable.total_bill_amount)}
                                </div>
                                <div className="text-center text-gray-500 text-sm">
                                    Current Total
                                </div>
                            </div>

                            {/* Discount Options */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Discount Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={billingData.discount_amount}
                                    onChange={(e) => setBillingData({
                                        ...billingData,
                                        discount_amount: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Discount Percentage (%)
                                </label>
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
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Service Charge (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={billingData.service_charge}
                                    onChange={(e) => setBillingData({
                                        ...billingData,
                                        service_charge: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={billingData.payment_method}
                                    onChange={(e) => setBillingData({
                                        ...billingData,
                                        payment_method: e.target.value
                                    })}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="online">Online</option>
                                    <option value="mixed">Mixed Payment</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Customer Notes
                                </label>
                                <textarea
                                    value={billingData.notes}
                                    onChange={(e) => setBillingData({
                                        ...billingData,
                                        notes: e.target.value
                                    })}
                                    className="w-full border rounded px-3 py-2"
                                    rows="2"
                                    placeholder="Optional notes for customer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={billingData.admin_notes}
                                    onChange={(e) => setBillingData({
                                        ...billingData,
                                        admin_notes: e.target.value
                                    })}
                                    className="w-full border rounded px-3 py-2"
                                    rows="2"
                                    placeholder="Internal admin notes"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowBillModal(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={completeBilling}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Complete Billing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Detail Modal */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Table {selectedTable.table_number} Details
                            </h3>
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Table Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Capacity</p>
                                        <p className="font-medium">{selectedTable.capacity} people</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getTableStatusColor(selectedTable.status)}`}>
                                            {getTableStatusIcon(selectedTable.status)} {selectedTable.status.charAt(0).toUpperCase() + selectedTable.status.slice(1)}
                                        </div>
                                    </div>
                                    {selectedTable.location && (
                                        <div>
                                            <p className="text-sm text-gray-500">Location</p>
                                            <p className="font-medium">{selectedTable.location}</p>
                                        </div>
                                    )}
                                    {selectedTable.time_occupied > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500">Occupied Time</p>
                                            <p className="font-medium">{formatDuration(selectedTable.time_occupied)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Orders */}
                            {selectedTable.active_orders && selectedTable.active_orders.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Active Orders ({selectedTable.active_orders.length})</h4>
                                    <div className="space-y-2">
                                        {selectedTable.active_orders.map((order, index) => (
                                            <div key={index} className="border rounded p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-medium">{order.menu_item_name}</h5>
                                                    <span className={`px-2 py-1 rounded text-xs ${getTableStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Quantity: {order.quantity} • Order: {order.order_number}
                                                </p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-sm text-gray-500">
                                                        Created by: {order.created_by_name}
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        Amount: {formatCurrency(order.total_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Billing Information */}
                            {selectedTable.total_bill_amount > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Current Bill</h4>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-800">
                                            {formatCurrency(selectedTable.total_bill_amount)}
                                        </div>
                                        {selectedTable.status === 'occupied' && (
                                            <button
                                                onClick={() => {
                                                    setBillingTable(selectedTable);
                                                    setShowBillModal(true);
                                                    setSelectedTable(null);
                                                }}
                                                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                💳 Complete Billing
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-4 pt-4 border-t">
                                <Link href={`/admin/mobile-ordering?table=${selectedTable.id}`} legacyBehavior>
                                    <a className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600">
                                        📱 Add Order
                                    </a>
                                </Link>
                                <button
                                    onClick={() => setSelectedTable(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Order Management Modal - ADDED */}
            <AdminOrderManagement
                table={managingTable}
                isOpen={showOrderManagement}
                onClose={() => setShowOrderManagement(false)}
                onOrdersUpdated={loadInitialData}
            />
        </div>
    );
}

export default withRoleGuard(TableManagementDashboard, ['admin', 'manager']);
