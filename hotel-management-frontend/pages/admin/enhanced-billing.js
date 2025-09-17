// pages/admin/enhanced-billing.js - COMPLETE WITH CUSTOMER HANDLING & GST
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

    // GST and billing settings
    const [gstSettings, setGstSettings] = useState({
        apply_gst: true,
        gst_rate: 18,
        interstate: false,
        discount_percent: 0,
        discount_amount: 0
    });

    // Bill calculation results
    const [billBreakdown, setBillBreakdown] = useState(null);

    // Customer details management
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: 'Guest',
        phone: ''
    });

    // Item management states
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // New item form
    const [newItem, setNewItem] = useState({
        item_name: '',
        quantity: 1,
        price: 0,
        notes: ''
    });

    // Bill generation state
    const [showBillModal, setShowBillModal] = useState(false);
    const [billCustomer, setBillCustomer] = useState({
        name: 'Guest',
        phone: '',
        payment_method: 'cash'
    });

    // Auto refresh functionality
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
                        // Update customer details if available
                        if (updatedTable.customer_name) {
                            setBillCustomer(prev => ({
                                ...prev,
                                name: updatedTable.customer_name,
                                phone: updatedTable.customer_phone || ''
                            }));
                        }
                        // Recalculate bill if table updated
                        if (billBreakdown) {
                            calculateBill(updatedTable.table_id);
                        }
                    } else {
                        // Table no longer active, clear selection
                        setSelectedTable(null);
                        setBillBreakdown(null);
                    }
                }
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to fetch active tables');
            }
        } catch (error) {
            console.error('Error fetching active tables:', error);
            if (!silent) {
                toast.error('Failed to load active tables: ' + error.message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const selectTable = async (table) => {
        setSelectedTable(table);
        setBillBreakdown(null);

        // Set customer info from table data
        setBillCustomer(prev => ({
            ...prev,
            name: table.customer_name || 'Guest',
            phone: table.customer_phone || ''
        }));

        setCustomerDetails({
            name: table.customer_name || 'Guest',
            phone: table.customer_phone || ''
        });

        // Calculate initial bill breakdown
        await calculateBill(table.table_id);
    };

    const updateCustomerDetails = async () => {
        if (!selectedTable) {
            toast.error('Please select a table first');
            return;
        }

        try {
            const response = await fetch('/api/bills/enhanced/update_customer_details/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table_id: selectedTable.table_id,
                    customer_name: customerDetails.name,
                    customer_phone: customerDetails.phone
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);

                // Update bill customer details
                setBillCustomer(prev => ({
                    ...prev,
                    name: customerDetails.name,
                    phone: customerDetails.phone
                }));

                setShowCustomerModal(false);

                // Refresh tables to get updated data
                await fetchActiveTables();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update customer details');
            }
        } catch (error) {
            console.error('Error updating customer details:', error);
            toast.error('Failed to update customer details: ' + error.message);
        }
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
            toast.error('Failed to calculate bill: ' + error.message);
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

                // Reset form and close modal
                setNewItem({ item_name: '', quantity: 1, price: 0, notes: '' });
                setShowAddItemModal(false);

                // Refresh data
                await fetchActiveTables();

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
            toast.error('Failed to add item: ' + error.message);
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
            toast.error('Failed to delete item: ' + error.message);
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
                toast.success('Quantity updated successfully');

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
            toast.error('Failed to update quantity: ' + error.message);
        }
    };

    const generateFinalBill = async () => {
        if (!selectedTable || !billBreakdown) {
            toast.error('Please calculate the bill first');
            return;
        }

        // Use customer details or defaults
        const finalCustomerName = billCustomer.name.trim() || 'Guest';
        const finalCustomerPhone = billCustomer.phone.trim() || 'N/A';

        try {
            const response = await fetch('/api/bills/enhanced/generate_final_bill/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table_id: selectedTable.table_id,
                    customer_name: finalCustomerName,
                    customer_phone: finalCustomerPhone,
                    payment_method: billCustomer.payment_method,
                    ...gstSettings
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Success notification with D-mart style details
                toast.success(
                    `✅ D-mart Style Bill Generated!\n` +
                    `Receipt: ${data.bill.receipt_number}\n` +
                    `Customer: ${data.bill.customer_name}\n` +
                    `Total: ₹${data.bill.total_amount}\n` +
                    `Table ${data.table.table_number} is now ${data.table.status}\n` +
                    `${data.table_freed ? '🆓 Table Freed Successfully!' : ''}`,
                    { 
                        duration: 8000,
                        style: {
                            background: '#10B981',
                            color: 'white',
                            fontWeight: 'bold'
                        }
                    }
                );

                // Clear selection and refresh
                setSelectedTable(null);
                setBillBreakdown(null);
                setShowBillModal(false);
                setBillCustomer({ name: 'Guest', phone: '', payment_method: 'cash' });

                await fetchActiveTables();

            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to generate bill');
            }
        } catch (error) {
            console.error('Error generating bill:', error);
            toast.error('Failed to generate bill: ' + error.message);
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            Loading Enhanced Billing Dashboard
                        </h2>
                        <p className="text-gray-500">
                            Fetching active tables and orders...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">
                                Enhanced Billing Dashboard
                            </h1>
                            <p className="text-blue-100 text-lg">
                                Professional D-mart style billing with GST compliance • Customer management • Table freeing
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <div className="text-sm text-blue-200">Status</div>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${refreshing ? 'bg-yellow-300 animate-pulse' : 'bg-green-300'}`}></div>
                                    <span className="text-sm">{refreshing ? 'Refreshing...' : 'Live'}</span>
                                </div>
                                <div className="text-xs text-blue-200 mt-1">
                                    Auto-refresh: 30s
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Active Tables</h3>
                                <p className="text-3xl font-bold text-gray-900">{activeTables.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Pending Revenue</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(activeTables.reduce((sum, table) => sum + table.subtotal, 0))}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9m0 4h8m-8 0l-1-1m1 1l-1 1m8-4v4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {activeTables.reduce((sum, table) => sum + table.orders_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex items-center">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(activeTables.length > 0 
                                        ? activeTables.reduce((sum, table) => sum + table.subtotal, 0) / activeTables.length 
                                        : 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Tables List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Active Tables with Orders
                                </h2>
                                <p className="text-gray-600">
                                    Click on a table to view details and generate D-mart style bill
                                </p>
                            </div>

                            <div className="p-6">
                                {activeTables.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                                        <p className="text-gray-500">
                                            Orders placed will appear here automatically
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeTables.map(table => (
                                            <div
                                                key={table.table_id}
                                                className={`border rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                                                    selectedTable?.table_id === table.table_id 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                                onClick={() => selectTable(table)}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">
                                                            Table {table.table_number}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {table.orders_count} order(s) • Cap: {table.table_capacity}
                                                            {table.table_location && ` • ${table.table_location}`}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Last order: {formatTime(table.last_order_time)}
                                                        </p>
                                                        {/* Customer info display */}
                                                        <div className="mt-2 flex items-center space-x-4">
                                                            <span className="text-sm text-blue-600">
                                                                👤 {table.customer_name || 'Guest'}
                                                            </span>
                                                            {table.customer_phone && table.customer_phone !== 'N/A' && (
                                                                <span className="text-sm text-green-600">
                                                                    📞 {table.customer_phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {formatCurrency(table.subtotal)}
                                                        </div>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Ready to Bill
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick preview of items */}
                                                <div className="border-t pt-3">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <strong>Items:</strong> {table.orders.flatMap(order => 
                                                            order.items.map(item => `${item.name} (${item.quantity})`)
                                                        ).slice(0, 3).join(', ')}
                                                        {table.orders.flatMap(order => order.items).length > 3 && '...'}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            Click to manage items & generate bill
                                                        </span>
                                                        {selectedTable?.table_id === table.table_id && (
                                                            <span className="text-xs text-blue-600 font-medium">
                                                                ← Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selected Table Details */}
                    <div className="lg:col-span-1">
                        {selectedTable ? (
                            <div className="space-y-6">
                                {/* Customer Management */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Customer Details
                                        </h3>
                                        <button
                                            onClick={() => setShowCustomerModal(true)}
                                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <span className="text-gray-600 w-16">Name:</span>
                                            <span className="font-medium">{billCustomer.name}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-600 w-16">Phone:</span>
                                            <span className="font-medium">{billCustomer.phone || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Management */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        Table {selectedTable.table_number} Management
                                    </h3>

                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowAddItemModal(true)}
                                            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                                        >
                                            ➕ Add Custom Item
                                        </button>

                                        <button
                                            onClick={() => calculateBill(selectedTable.table_id)}
                                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                        >
                                            🧮 Recalculate Bill
                                        </button>
                                    </div>
                                </div>

                                {/* Orders and Items */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>

                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {selectedTable.orders.map(order => (
                                            <div key={order.order_id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm">
                                                        Order #{order.order_number}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        order.status === 'served' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between py-2 border-t">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{item.name}</div>
                                                            {item.special_instructions && (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    Note: {item.special_instructions}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center space-x-2 ml-4">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                                className="w-16 text-center border rounded px-1 py-1 text-sm"
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {formatCurrency(item.total)}
                                                            </span>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                className="text-red-500 hover:text-red-700 text-sm p-1"
                                                                title="Delete item"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* GST Settings */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">GST & Billing Options</h4>

                                    <div className="space-y-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={gstSettings.apply_gst}
                                                onChange={(e) => {
                                                    setGstSettings({...gstSettings, apply_gst: e.target.checked});
                                                    if (selectedTable) calculateBill(selectedTable.table_id);
                                                }}
                                                className="mr-2 h-4 w-4 text-blue-600"
                                            />
                                            <span className="font-medium">Apply GST</span>
                                        </label>

                                        {gstSettings.apply_gst && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        GST Rate (%)
                                                    </label>
                                                    <select
                                                        value={gstSettings.gst_rate}
                                                        onChange={(e) => {
                                                            setGstSettings({...gstSettings, gst_rate: parseFloat(e.target.value)});
                                                            if (selectedTable) calculateBill(selectedTable.table_id);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                    >
                                                        <option value={0}>0%</option>
                                                        <option value={5}>5%</option>
                                                        <option value={12}>12%</option>
                                                        <option value={18}>18%</option>
                                                        <option value={28}>28%</option>
                                                    </select>
                                                </div>

                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={gstSettings.interstate}
                                                        onChange={(e) => {
                                                            setGstSettings({...gstSettings, interstate: e.target.checked});
                                                            if (selectedTable) calculateBill(selectedTable.table_id);
                                                        }}
                                                        className="mr-2 h-4 w-4 text-blue-600"
                                                    />
                                                    <span>Interstate (IGST)</span>
                                                </label>
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={gstSettings.discount_percent}
                                                    onChange={(e) => {
                                                        setGstSettings({...gstSettings, discount_percent: parseFloat(e.target.value) || 0});
                                                        if (selectedTable) calculateBill(selectedTable.table_id);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={gstSettings.discount_amount}
                                                    onChange={(e) => {
                                                        setGstSettings({...gstSettings, discount_amount: parseFloat(e.target.value) || 0});
                                                        if (selectedTable) calculateBill(selectedTable.table_id);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bill Summary with Full GST Display */}
                                {billBreakdown && (
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                            📄 D-mart Style Bill Preview
                                        </h4>

                                        <div className="space-y-2 text-sm border p-4 rounded bg-gray-50">
                                            {/* Header Info */}
                                            <div className="text-center border-b pb-2 mb-2">
                                                <div className="font-bold">HOTEL RESTAURANT</div>
                                                <div className="text-xs">Table {billBreakdown.table_number}</div>
                                            </div>

                                            {/* Items Summary */}
                                            <div className="flex justify-between">
                                                <span>Items ({billBreakdown.item_count}):</span>
                                                <span>{formatCurrency(billBreakdown.subtotal)}</span>
                                            </div>

                                            {billBreakdown.discount_amount > 0 && (
                                                <div className="flex justify-between text-orange-600">
                                                    <span>Discount:</span>
                                                    <span>-{formatCurrency(billBreakdown.discount_amount)}</span>
                                                </div>
                                            )}

                                            {billBreakdown.gst_applied && billBreakdown.total_gst_amount > 0 && (
                                                <>
                                                    <div className="border-t pt-2">
                                                        <div className="flex justify-between text-xs text-gray-600">
                                                            <span>Taxable Amount:</span>
                                                            <span>{formatCurrency(billBreakdown.taxable_amount)}</span>
                                                        </div>
                                                        {billBreakdown.interstate ? (
                                                            <div className="flex justify-between text-blue-600">
                                                                <span>IGST ({billBreakdown.gst_rate}%):</span>
                                                                <span>{formatCurrency(billBreakdown.igst_amount)}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between text-blue-600">
                                                                    <span>CGST ({billBreakdown.cgst_rate}%):</span>
                                                                    <span>{formatCurrency(billBreakdown.cgst_amount)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-blue-600">
                                                                    <span>SGST ({billBreakdown.sgst_rate}%):</span>
                                                                    <span>{formatCurrency(billBreakdown.sgst_amount)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            <div className="border-t pt-2 flex justify-between font-bold text-lg text-green-600">
                                                <span>TOTAL AMOUNT:</span>
                                                <span>{formatCurrency(billBreakdown.total_amount)}</span>
                                            </div>

                                            {billBreakdown.total_savings > 0 && (
                                                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                                                    <div className="text-green-700 font-medium text-center text-xs">
                                                        🎉 You Saved {formatCurrency(billBreakdown.total_savings)}! 🎉
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setShowBillModal(true)}
                                            className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95"
                                        >
                                            🧾 Generate Bill & Free Table
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9m0 4h8m-8 0l-1-1m1 1l-1 1m8-4v4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Select a table to view details
                                </h3>
                                <p className="text-gray-500">
                                    Choose from active tables on the left to manage orders and generate bills
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Details Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Update Customer Details
                                </h3>
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customerDetails.name}
                                        onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerDetails.phone}
                                        onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer phone number"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateCustomerDetails}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Update Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Add Custom Item to Table {selectedTable?.table_number}
                                </h3>
                                <button
                                    onClick={() => setShowAddItemModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.item_name}
                                        onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter item name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={newItem.notes}
                                        onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="2"
                                        placeholder="Any special notes"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowAddItemModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCustomItem}
                                    disabled={!newItem.item_name || !newItem.price}
                                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Bill Modal */}
            {showBillModal && selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Generate Final Bill & Free Table
                                </h3>
                                <button
                                    onClick={() => setShowBillModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={billCustomer.name}
                                        onChange={(e) => setBillCustomer({...billCustomer, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer name (defaults to Guest)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for 'Guest'</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={billCustomer.phone}
                                        onChange={(e) => setBillCustomer({...billCustomer, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer phone (optional)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for 'N/A'</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        value={billCustomer.payment_method}
                                        onChange={(e) => setBillCustomer({...billCustomer, payment_method: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>

                                {billBreakdown && (
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <h4 className="font-medium text-gray-900 mb-2">Bill Summary</h4>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span>Table:</span>
                                                <span>#{selectedTable.table_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Items:</span>
                                                <span>{billBreakdown.item_count}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                                <span>Total:</span>
                                                <span>{formatCurrency(billBreakdown.total_amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowBillModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generateFinalBill}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all font-medium"
                                >
                                    🧾 Generate & Free Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default EnhancedBilling;
