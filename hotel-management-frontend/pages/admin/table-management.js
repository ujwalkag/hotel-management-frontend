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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading table management...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    🏪 Table Management Dashboard
                </h1>

                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>

                        <button
                            onClick={loadInitialData}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    <div className="flex space-x-3">
                        <Link 
                            href="/admin/mobile-ordering"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            📱 Mobile Ordering
                        </Link>
                        <Link 
                            href="/admin/kitchen-display"
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            🍳 Kitchen Display
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats.tables && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Free Tables</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {dashboardStats.tables.free}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 font-bold">👥</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Occupied</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {dashboardStats.tables.occupied}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">#</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Orders</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {dashboardStats.orders?.preparing || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold">💰</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(dashboardStats.revenue?.today || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map(table => (
                    <div
                        key={table.id}
                        className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                        onClick={() => setSelectedTable(table)}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Table {table.table_number}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Capacity: {table.capacity} people
                                    </p>
                                </div>

                                <div className="text-3xl">
                                    {getTableStatusIcon(table.status)}
                                </div>
                            </div>

                            <div className={`px-3 py-2 rounded-full text-sm font-medium border mb-4 ${getTableStatusColor(table.status)}`}>
                                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                            </div>

                            {table.active_orders && table.active_orders.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm font-medium text-gray-700">
                                        Active Orders ({table.active_orders.length}):
                                    </p>
                                    {table.active_orders.slice(0, 3).map((order, index) => (
                                        <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                            {order.menu_item_name} x{order.quantity}
                                            <span className={`ml-2 px-1 rounded text-xs ${
                                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                                                'bg-orange-100 text-orange-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    ))}
                                    {table.active_orders.length > 3 && (
                                        <div className="text-xs text-gray-500">
                                            +{table.active_orders.length - 3} more orders
                                        </div>
                                    )}
                                </div>
                            )}

                            {table.total_bill_amount > 0 && (
                                <div className="text-lg font-bold text-green-600 mb-2">
                                    Bill: {formatCurrency(table.total_bill_amount)}
                                </div>
                            )}

                            {table.time_occupied > 0 && (
                                <div className="text-sm text-gray-500">
                                    Occupied for: {formatDuration(table.time_occupied)}
                                </div>
                            )}

                            {table.location && (
                                <div className="text-xs text-gray-400 mt-2">
                                    📍 {table.location}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Detail Modal */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Table {selectedTable.table_number} Details
                                </h2>
                                <p className="text-gray-600">Capacity: {selectedTable.capacity} people</p>
                            </div>
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Current Status */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Status</h3>
                            <div className="flex items-center space-x-4">
                                <div className={`px-4 py-2 rounded-full border ${getTableStatusColor(selectedTable.status)}`}>
                                    {getTableStatusIcon(selectedTable.status)} {selectedTable.status.charAt(0).toUpperCase() + selectedTable.status.slice(1)}
                                </div>

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
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Active Orders ({selectedTable.active_orders.length})
                                </h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {selectedTable.active_orders.map((order, index) => (
                                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">
                                                        {order.menu_item_name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Quantity: {order.quantity} • Order: {order.order_number}
                                                    </p>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {order.status}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
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
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">
                                    Current Bill
                                </h3>
                                <div className="text-2xl font-bold text-green-600 mb-3">
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Table Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Capacity:</span>
                                    <span className="ml-2 font-medium">{selectedTable.capacity} people</span>
                                </div>
                                {selectedTable.location && (
                                    <div>
                                        <span className="text-gray-600">Location:</span>
                                        <span className="ml-2 font-medium">{selectedTable.location}</span>
                                    </div>
                                )}
                                {selectedTable.time_occupied > 0 && (
                                    <div>
                                        <span className="text-gray-600">Occupied Time:</span>
                                        <span className="ml-2 font-medium">{formatDuration(selectedTable.time_occupied)}</span>
                                    </div>
                                )}
                                {selectedTable.last_order_time && (
                                    <div>
                                        <span className="text-gray-600">Last Order:</span>
                                        <span className="ml-2 font-medium">
                                            {new Date(selectedTable.last_order_time).toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <Link
                                href={`/admin/mobile-ordering?table=${selectedTable.id}`}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                            >
                                📱 Add Order
                            </Link>

                            <button
                                onClick={() => setSelectedTable(null)}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withRoleGuard(TableManagementDashboard, ['admin', 'manager']);

