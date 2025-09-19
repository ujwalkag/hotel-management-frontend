// pages/admin/enhanced-billing.js - COMPLETE Enhanced Billing with ALL Fixes
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

    // Use correct restaurant API endpoints
    const fetchActiveTables = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            // Use restaurant API endpoint instead of /api/bills/enhanced/
            const response = await fetch('/api/restaurant/bills/enhanced/active_tables_dashboard/', {
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

    // Use restaurant API endpoint for customer updates
    const updateCustomerDetails = async () => {
        if (!selectedTable) {
            toast.error('Please select a table first');
            return;
        }

        try {
            // Use restaurant table endpoint for customer updates
            const response = await fetch(`/api/restaurant/tables/${selectedTable.table_id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    customer_name: customerDetails.name,
                    customer_phone: customerDetails.phone
                })
            });

            if (response.ok) {
                toast.success('Customer details updated successfully');

                // Update bill customer details
                setBillCustomer(prev => ({
                    ...prev,
                    name: customerDetails.name,
                    phone: customerDetails.phone
                }));

                setShowCustomerModal(false);
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

    // Use correct API endpoint for bill calculation
    const calculateBill = async (tableId) => {
        try {
            const response = await fetch('/api/restaurant/bills/enhanced/calculate_bill_with_gst/', {
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

    // Use restaurant API for adding custom items
    const addCustomItem = async () => {
        if (!selectedTable || !newItem.item_name || !newItem.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            // Use restaurant orders endpoint to add custom items
            const response = await fetch('/api/restaurant/orders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    table: selectedTable.table_id,
                    menu_item_name: newItem.item_name,
                    quantity: newItem.quantity,
                    unit_price: parseFloat(newItem.price),
                    special_instructions: newItem.notes,
                    source: 'admin_added'
                })
            });

            if (response.ok) {
                toast.success('Custom item added successfully');

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

    // Use restaurant API for deleting items
    const deleteItem = async (orderItemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const response = await fetch(`/api/restaurant/orders/${orderItemId}/cancel_order/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                }
            });

            if (response.ok) {
                toast.success('Item removed successfully');
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

    // Use restaurant API for updating quantities
    const updateQuantity = async (orderItemId, newQuantity) => {
        try {
            const response = await fetch(`/api/restaurant/orders/${orderItemId}/modify_order/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                toast.success('Quantity updated successfully');
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

    // Use correct API endpoint for final bill generation
    const generateFinalBill = async () => {
        if (!selectedTable || !billBreakdown) {
            toast.error('Please calculate the bill first');
            return;
        }

        // Use customer details or defaults
        const finalCustomerName = billCustomer.name.trim() || 'Guest';
        const finalCustomerPhone = billCustomer.phone.trim() || '';

        try {
            const response = await fetch('/api/restaurant/bills/enhanced/generate_final_bill/', {
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

                // Success notification with enhanced details
                toast.success(
                    `✅ Bill Generated Successfully!\n` +
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
        if (!isoString) return 'N/A';
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
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Loading Enhanced Billing Dashboard
                        </h2>
                        <p className="text-gray-600">
                            Fetching active tables and orders...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Enhanced Billing Dashboard
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Professional billing with GST compliance • Customer management • Table management
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className={`h-3 w-3 rounded-full ${refreshing ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`text-sm font-medium ${refreshing ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {refreshing ? 'Refreshing...' : 'Live'}
                                    </span>
                                    <span className="text-xs text-gray-400">Auto-refresh: 30s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="text-2xl">🏪</div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Active Tables</dt>
                                            <dd className="text-lg font-medium text-gray-900">{activeTables.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="text-2xl">💰</div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Revenue</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(activeTables.reduce((sum, table) => sum + table.subtotal, 0))}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="text-2xl">📋</div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {activeTables.reduce((sum, table) => sum + table.orders_count, 0)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="text-2xl">📊</div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(activeTables.length > 0 
                                                    ? activeTables.reduce((sum, table) => sum + table.subtotal, 0) / activeTables.length 
                                                    : 0)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Active Tables List */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Active Tables with Orders</h2>
                                <p className="text-sm text-gray-500 mt-1">Click on a table to view details and generate bill</p>
                            </div>

                            <div className="p-6">
                                {activeTables.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">🏪</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                                        <p className="text-gray-500">Orders placed will appear here automatically</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeTables.map(table => (
                                            <div
                                                key={table.table_id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedTable?.table_id === table.table_id 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => selectTable(table)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-medium text-gray-900">Table {table.table_number}</h3>
                                                    <div className="text-right">
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(table.subtotal)}
                                                        </div>
                                                        <div className="text-sm text-green-600 font-medium">Ready to Bill</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-sm text-gray-500 mb-2">
                                                    {table.orders_count} order(s) • Cap: {table.table_capacity}
                                                    {table.table_location && ` • ${table.table_location}`}
                                                </div>
                                                
                                                <div className="text-xs text-gray-400 mb-2">
                                                    Last order: {formatTime(table.last_order_time)}
                                                </div>

                                                {/* Customer info display */}
                                                <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                                                    <span>👤 {table.customer_name || 'Guest'}</span>
                                                    {table.customer_phone && table.customer_phone !== 'N/A' && (
                                                        <span>📞 {table.customer_phone}</span>
                                                    )}
                                                </div>

                                                {/* Quick preview of items */}
                                                <div className="text-xs text-gray-500 mb-2">
                                                    <span className="font-medium">Items:</span> {table.orders.flatMap(order => 
                                                        order.items.map(item => `${item.name} (${item.quantity})`)
                                                    ).slice(0, 3).join(', ')}
                                                    {table.orders.flatMap(order => order.items).length > 3 && '...'}
                                                </div>
                                                
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Click to manage items & generate bill</span>
                                                    {selectedTable?.table_id === table.table_id && (
                                                        <span className="text-blue-600 font-medium">← Selected</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Table Details */}
                        <div className="bg-white shadow rounded-lg">
                            {selectedTable ? (
                                <div>
                                    {/* Customer Management */}
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Name:</span>
                                                <div className="text-sm text-gray-900">{billCustomer.name}</div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Phone:</span>
                                                <div className="text-sm text-gray-900">{billCustomer.phone || 'Not provided'}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowCustomerModal(true)}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Edit Customer Details
                                        </button>
                                    </div>

                                    {/* Table Management */}
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Table {selectedTable.table_number} Management
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setShowAddItemModal(true)}
                                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                            >
                                                Add Custom Item
                                            </button>
                                        </div>
                                    </div>

                                    {/* Orders and Items */}
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                        
                                        {selectedTable.orders.map(order => (
                                            <div key={order.order_number} className="mb-4 p-3 bg-gray-50 rounded">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium">Order #{order.order_number}</span>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        order.status === 'served' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{item.name}</div>
                                                            {item.special_instructions && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Note: {item.special_instructions}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                                className="w-16 text-center border rounded px-1 py-1 text-sm"
                                                            />
                                                            <span className="text-sm font-medium w-20 text-right">
                                                                {formatCurrency(item.total)}
                                                            </span>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                className="text-red-600 hover:text-red-800 text-sm p-1"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* GST Settings */}
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h4 className="font-medium text-gray-900 mb-3">GST & Billing Options</h4>
                                        
                                        <div className="space-y-3">
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
                                                Apply GST
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
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
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
                                                        Interstate (IGST)
                                                    </label>
                                                </>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Discount (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
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
                                        <div className="px-6 py-4">
                                            <h4 className="font-medium text-gray-900 mb-3">📄 Bill Preview</h4>
                                            
                                            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                                                {/* Header Info */}
                                                <div className="text-center font-bold border-b pb-2 mb-2">
                                                    HOTEL RESTAURANT
                                                    <br />Table {billBreakdown.table_number}
                                                </div>

                                                {/* Items Summary */}
                                                <div className="flex justify-between">
                                                    <span>Items ({billBreakdown.item_count}):</span>
                                                    <span>{formatCurrency(billBreakdown.subtotal)}</span>
                                                </div>

                                                {billBreakdown.discount_amount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Discount:</span>
                                                        <span>-{formatCurrency(billBreakdown.discount_amount)}</span>
                                                    </div>
                                                )}

                                                {billBreakdown.gst_applied && billBreakdown.total_gst_amount > 0 && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Taxable Amount:</span>
                                                            <span>{formatCurrency(billBreakdown.taxable_amount)}</span>
                                                        </div>
                                                        {billBreakdown.interstate ? (
                                                            <div className="flex justify-between">
                                                                <span>IGST ({billBreakdown.gst_rate}%):</span>
                                                                <span>{formatCurrency(billBreakdown.igst_amount)}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span>CGST ({billBreakdown.cgst_rate}%):</span>
                                                                    <span>{formatCurrency(billBreakdown.cgst_amount)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>SGST ({billBreakdown.sgst_rate}%):</span>
                                                                    <span>{formatCurrency(billBreakdown.sgst_amount)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                                    <span>TOTAL AMOUNT:</span>
                                                    <span>{formatCurrency(billBreakdown.total_amount)}</span>
                                                </div>

                                                {billBreakdown.total_savings > 0 && (
                                                    <div className="text-center text-green-600 font-bold">
                                                        🎉 You Saved {formatCurrency(billBreakdown.total_savings)}! 🎉
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setShowBillModal(true)}
                                                className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
                                            >
                                                Generate Final Bill & Free Table
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <div className="text-4xl mb-4">🏪</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a table to view details</h3>
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
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Customer Details</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customerDetails.name}
                                        onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={customerDetails.phone}
                                        onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer phone number"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateCustomerDetails}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Update Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Item Modal */}
                {showAddItemModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Add Custom Item to Table {selectedTable?.table_number}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={newItem.notes}
                                        onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="2"
                                        placeholder="Any special notes"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setShowAddItemModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCustomItem}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate Bill Modal */}
                {showBillModal && selectedTable && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Generate Final Bill & Free Table
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                    <input
                                        type="text"
                                        value={billCustomer.name}
                                        onChange={(e) => setBillCustomer({...billCustomer, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer name (defaults to Guest)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={billCustomer.phone}
                                        onChange={(e) => setBillCustomer({...billCustomer, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Customer phone (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
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
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Bill Summary</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Table:</span>
                                                <span>#{selectedTable.table_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Items:</span>
                                                <span>{billBreakdown.item_count}</span>
                                            </div>
                                            <div className="flex justify-between font-medium">
                                                <span>Total:</span>
                                                <span>{formatCurrency(billBreakdown.total_amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setShowBillModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generateFinalBill}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                >
                                    Generate Bill & Free Table
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EnhancedBilling;
