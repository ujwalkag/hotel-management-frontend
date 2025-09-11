
// pages/admin/enhanced-billing.js - COMPLETELY NEW ENHANCED BILLING DASHBOARD
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

const EnhancedBilling = () => {
    const { user } = useAuth();
    const [activeTables, setActiveTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [gstSettings, setGstSettings] = useState({
        apply_gst: true,
        gst_rate: 18,
        interstate: false,
        discount_percent: 0,
        discount_amount: 0
    });
    const [billBreakdown, setBillBreakdown] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({
        item_name: '',
        quantity: 1,
        price: 0,
        notes: ''
    });

    // Auto refresh
    const intervalRef = useRef();

    useEffect(() => {
        fetchActiveTables();

        // Auto refresh every 30 seconds
        intervalRef.current = setInterval(() => {
            fetchActiveTables(true); // Silent refresh
        }, 30000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const fetchActiveTables = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            const response = await fetch('/api/bills/enhanced/active_tables_dashboard/', {
                headers: { 
                    Authorization: `Bearer ${user.access}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setActiveTables(data.active_tables || []);

                // Update selected table if it exists in new data
                if (selectedTable) {
                    const updatedTable = data.active_tables?.find(t => t.table_id === selectedTable.table_id);
                    if (updatedTable) {
                        setSelectedTable(updatedTable);
                    } else {
                        // Table no longer active, clear selection
                        setSelectedTable(null);
                        setBillBreakdown(null);
                    }
                }
            } else {
                throw new Error('Failed to fetch active tables');
            }
        } catch (error) {
            console.error('Error fetching active tables:', error);
            if (!silent) {
                toast.error('Failed to load active tables');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const selectTable = async (table) => {
        setSelectedTable(table);
        setBillBreakdown(null);

        // Calculate initial bill breakdown
        await calculateBill(table.table_id);
    };

    const calculateBill = async (tableId) => {
        try {
            const response = await fetch('/api/bills/enhanced/calculate_bill_with_gst/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table_id: tableId,
                    ...gstSettings
                })
            });

            if (response.ok) {
                const data = await response.json();
                setBillBreakdown(data.bill_breakdown);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to calculate bill');
            }
        } catch (error) {
            console.error('Error calculating bill:', error);
            toast.error('Failed to calculate bill');
        }
    };

    const addCustomItem = async () => {
        if (!selectedTable || !newItem.item_name || !newItem.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/bills/enhanced/add_custom_item_to_table/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table_id: selectedTable.table_id,
                    item_name: newItem.item_name,
                    quantity: newItem.quantity,
                    price: parseFloat(newItem.price),
                    notes: newItem.notes
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);

                // Refresh data
                await fetchActiveTables();

                // Reset form and close modal
                setNewItem({ item_name: '', quantity: 1, price: 0, notes: '' });
                setShowAddItemModal(false);

                // Recalculate bill
                if (selectedTable) {
                    await calculateBill(selectedTable.table_id);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Failed to add item');
        }
    };

    const deleteItem = async (orderItemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const response = await fetch('/api/bills/enhanced/delete_item_from_table/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    order_item_id: orderItemId
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);

                // Refresh data
                await fetchActiveTables();

                // Recalculate bill
                if (selectedTable) {
                    await calculateBill(selectedTable.table_id);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        }
    };

    const updateQuantity = async (orderItemId, newQuantity) => {
        try {
            const response = await fetch('/api/bills/enhanced/update_item_quantity/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    order_item_id: orderItemId,
                    new_quantity: newQuantity
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Quantity updated');

                // Refresh data
                await fetchActiveTables();

                // Recalculate bill
                if (selectedTable) {
                    await calculateBill(selectedTable.table_id);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Failed to update quantity');
        }
    };

    const generateFinalBill = async () => {
        if (!selectedTable || !billBreakdown) {
            toast.error('Please calculate the bill first');
            return;
        }

        const customerName = prompt('Enter customer name:', selectedTable.orders[0]?.customer_name || 'Guest');
        if (!customerName) return;

        const customerPhone = prompt('Enter customer phone (optional):', '') || '';
        const paymentMethod = prompt('Payment method (cash/card/upi):', 'cash') || 'cash';

        try {
            const response = await fetch('/api/bills/enhanced/generate_final_bill/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table_id: selectedTable.table_id,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    payment_method: paymentMethod,
                    ...gstSettings
                })
            });

            if (response.ok) {
                const data = await response.json();

                toast.success(
                    `Bill generated successfully!\n` +
                    `Receipt: ${data.bill.receipt_number}\n` +
                    `Total: ₹${data.bill.total_amount}\n` +
                    `Table ${data.table.table_number} is now ${data.table.status}`,
                    { duration: 6000 }
                );

                // Clear selection and refresh
                setSelectedTable(null);
                setBillBreakdown(null);
                await fetchActiveTables();

            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to generate bill');
            }
        } catch (error) {
            console.error('Error generating bill:', error);
            toast.error('Failed to generate bill');
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading Enhanced Billing Dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Enhanced Billing Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Dynamic table-based billing • Orders from mobile app appear here automatically
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchActiveTables()}
                            disabled={refreshing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
                        </button>

                        <div className="text-sm text-gray-500 px-3 py-2 bg-gray-100 rounded-lg">
                            Auto-refresh: 30s
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Tables</p>
                                <p className="text-2xl font-bold text-gray-900">{activeTables.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{activeTables.reduce((sum, table) => sum + table.subtotal, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {activeTables.reduce((sum, table) => sum + table.orders_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{activeTables.length > 0 ? (activeTables.reduce((sum, table) => sum + table.subtotal, 0) / activeTables.length).toFixed(0) : '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Tables List */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Active Tables with Orders
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Click on a table to view details and generate bill
                            </p>
                        </div>

                        <div className="p-6">
                            {activeTables.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    <p className="text-gray-500 text-lg">No active orders</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Orders placed via mobile app will appear here automatically
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeTables.map(table => (
                                        <div
                                            key={table.table_id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                                selectedTable?.table_id === table.table_id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                            onClick={() => selectTable(table)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        Table {table.table_number}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {table.orders_count} order(s) • Cap: {table.table_capacity}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Last order: {formatTime(table.last_order_time)}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-600">
                                                        ₹{table.subtotal.toFixed(2)}
                                                    </p>
                                                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                        Ready to Bill
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quick preview of items */}
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-gray-500">
                                                    Items: {table.orders.flatMap(order => 
                                                        order.items.map(item => `${item.name} (${item.quantity})`)
                                                    ).slice(0, 3).join(', ')}
                                                    {table.orders.flatMap(order => order.items).length > 3 && '...'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Table Details */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        {selectedTable ? (
                            <>
                                <div className="p-6 border-b">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Table {selectedTable.table_number} Details
                                        </h2>
                                        <button
                                            onClick={() => setShowAddItemModal(true)}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Orders and Items */}
                                    <div>
                                        <h3 className="font-semibold mb-4">Order Items</h3>
                                        <div className="space-y-4">
                                            {selectedTable.orders.map(order => (
                                                <div key={order.order_id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div>
                                                            <span className="font-medium">Order #{order.order_number}</span>
                                                            <span className="ml-2 text-sm text-gray-600">
                                                                ({order.customer_name})
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {order.items.map(item => (
                                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                                                <div className="flex-1">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    {item.special_instructions && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Note: {item.special_instructions}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                            className="w-6 h-6 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                                        <button
                                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                            className="w-6 h-6 bg-green-100 text-green-600 rounded text-sm hover:bg-green-200 transition"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>

                                                                    <span className="w-20 text-right font-semibold">
                                                                        ₹{item.total.toFixed(2)}
                                                                    </span>

                                                                    <button
                                                                        onClick={() => deleteItem(item.id)}
                                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GST Settings */}
                                    <div className="border-t pt-6">
                                        <h3 className="font-semibold mb-4">GST & Billing Options</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={gstSettings.apply_gst}
                                                        onChange={(e) => setGstSettings({...gstSettings, apply_gst: e.target.checked})}
                                                        className="mr-2"
                                                    />
                                                    Apply GST
                                                </label>
                                            </div>

                                            <div>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={gstSettings.interstate}
                                                        onChange={(e) => setGstSettings({...gstSettings, interstate: e.target.checked})}
                                                        className="mr-2"
                                                        disabled={!gstSettings.apply_gst}
                                                    />
                                                    Interstate (IGST)
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    GST Rate (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={gstSettings.gst_rate}
                                                    onChange={(e) => setGstSettings({...gstSettings, gst_rate: parseFloat(e.target.value) || 0})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    disabled={!gstSettings.apply_gst}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={gstSettings.discount_percent}
                                                    onChange={(e) => setGstSettings({...gstSettings, discount_percent: parseFloat(e.target.value) || 0})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={gstSettings.discount_amount}
                                                    onChange={(e) => setGstSettings({...gstSettings, discount_amount: parseFloat(e.target.value) || 0})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => calculateBill(selectedTable.table_id)}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition mb-4"
                                        >
                                            Calculate Bill
                                        </button>
                                    </div>

                                    {/* Bill Breakdown */}
                                    {billBreakdown && (
                                        <div className="border-t pt-6">
                                            <h3 className="font-semibold mb-4">Bill Summary</h3>

                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>₹{billBreakdown.subtotal.toFixed(2)}</span>
                                                </div>

                                                {billBreakdown.discount_amount > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Discount:</span>
                                                        <span>-₹{billBreakdown.discount_amount.toFixed(2)}</span>
                                                    </div>
                                                )}

                                                {billBreakdown.gst_applied && (
                                                    <>
                                                        {billBreakdown.interstate ? (
                                                            <div className="flex justify-between">
                                                                <span>IGST ({billBreakdown.gst_rate}%):</span>
                                                                <span>₹{billBreakdown.total_gst_amount.toFixed(2)}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span>CGST ({billBreakdown.gst_rate/2}%):</span>
                                                                    <span>₹{billBreakdown.cgst_amount.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>SGST ({billBreakdown.gst_rate/2}%):</span>
                                                                    <span>₹{billBreakdown.sgst_amount.toFixed(2)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                                    <span>Total:</span>
                                                    <span className="text-green-600">₹{billBreakdown.total_amount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={generateFinalBill}
                                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition mt-4 font-semibold"
                                            >
                                                🧾 Generate Final Bill & Release Table
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-6">
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-gray-500 text-lg">Select a table to view details</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Choose from active tables on the left to manage orders and generate bills
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            Add Custom Item to Table {selectedTable?.table_number}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    value={newItem.item_name}
                                    onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter item name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={newItem.notes}
                                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                    placeholder="Any special notes"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddItemModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCustomItem}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default EnhancedBilling;

