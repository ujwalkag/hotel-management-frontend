// pages/staff/mobile-ordering.js - COMPLETE MOBILE ORDERING FIXED
// Create this new file for waiters to take orders

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function MobileOrdering() {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [menuCategories, setMenuCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const wsRef = useRef(null);

    useEffect(() => {
        loadInitialData();
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [user]);

    const connectWebSocket = () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/ordering/`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                console.log('✅ Ordering WebSocket connected');
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                console.log('❌ Ordering WebSocket disconnected');
                setTimeout(connectWebSocket, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket message received:', data);

                switch (data.type) {
                    case 'initial_ordering_data':
                        setTables(data.tables || []);
                        if (data.menu) {
                            processMenuData(data.menu);
                        }
                        break;

                    case 'tables_update':
                        setTables(data.tables || []);
                        break;

                    case 'order_confirmed':
                        toast.success(`✅ Order confirmed for Table ${data.table_id}`);
                        setCart([]);
                        break;

                    default:
                        console.log('Unknown message type:', data.type);
                }
            };

        } catch (error) {
            console.error('Error connecting WebSocket:', error);
        }
    };

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTables(),
                fetchMenuData()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('❌ Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/restaurant/tables/', {
                headers: {
                    Authorization: `Bearer ${user?.access}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTables(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    // FIXED: Use correct /api/menu/ endpoints
    const fetchMenuData = async () => {
        try {
            // Try existing menu API first
            const [categoriesRes, itemsRes] = await Promise.all([
                fetch('/api/menu/categories/', {  // FIXED: Correct endpoint
                    headers: { Authorization: `Bearer ${user?.access}` }
                }),
                fetch('/api/menu/items/', {      // FIXED: Correct endpoint
                    headers: { Authorization: `Bearer ${user?.access}` }
                })
            ]);

            if (categoriesRes.ok && itemsRes.ok) {
                const categories = await categoriesRes.json();
                const items = await itemsRes.json();
                
                setMenuCategories(Array.isArray(categories) ? categories : categories.results || []);
                setMenuItems(Array.isArray(items) ? items : items.results || []);
            } else {
                // Fallback: try restaurant API
                const response = await fetch('/api/restaurant/menu-for-ordering/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                });
                if (response.ok) {
                    const menuData = await response.json();
                    processMenuData(menuData);
                }
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            toast.error('⚠️ Restaurant menu API not available, trying fallback');
        }
    };

    const processMenuData = (menuData) => {
        setMenuCategories(menuData);
        
        // Flatten items for search
        const allItems = [];
        menuData.forEach(categoryData => {
            if (categoryData.items) {
                categoryData.items.forEach(item => {
                    allItems.push({
                        ...item,
                        category_id: categoryData.id,
                        category_name: categoryData.name
                    });
                });
            }
        });
        setMenuItems(allItems);
    };

    const addToCart = (item) => {
        if (!selectedTable) {
            toast.error('Please select a table first');
            return;
        }

        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1, notes: '' }]);
        }
        
        toast.success(`✅ Added ${item.name} to cart`);
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
        toast.info('❌ Item removed from cart');
    };

    const updateCartQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCart(cart.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        ));
    };

    // FIXED: Use correct bulk order API
    const submitOrder = async () => {
        if (!selectedTable || cart.length === 0) {
            toast.error('Please select a table and add items to cart');
            return;
        }

        const orderData = {
            table_id: selectedTable.id,
            orders: cart.map(item => ({
                menu_item: item.id,
                quantity: item.quantity,
                special_instructions: item.notes || '',
                source: 'mobile'
            }))
        };

        try {
            const response = await fetch('/api/restaurant/orders/bulk_create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`,
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(`✅ Order placed successfully! ${result.orders?.length || cart.length} items ordered for Table ${selectedTable.table_number}`);
                
                // Clear cart and refresh data
                setCart([]);
                await fetchTables();
                
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            toast.error(`❌ Failed to place order: ${error.message}`);
        }
    };

    const filteredItems = selectedCategory
        ? menuItems.filter(item => item.category_id?.toString() === selectedCategory)
        : menuItems;

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading mobile ordering system...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">📱 Mobile Ordering</h1>
                            <p className="text-sm text-gray-500">Waiter ordering system</p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Connection Status */}
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>

                            {/* Cart Summary */}
                            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                <span>🛒 {cart.length} items</span>
                                <span>₹{getTotalAmount().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Table Selection Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">🏪 Select Table</h2>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {tables.map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => setSelectedTable(table)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                            selectedTable?.id === table.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : table.status === 'free'
                                                ? 'border-green-200 hover:border-green-300'
                                                : 'border-red-200 opacity-50 cursor-not-allowed'
                                        }`}
                                        disabled={table.status !== 'free'}
                                    >
                                        <div className="font-medium text-gray-900">Table {table.table_number}</div>
                                        <div className={`text-sm mt-1 px-2 py-1 rounded ${
                                            table.status === 'free' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {table.status}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">Cap: {table.capacity}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedTable && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-medium text-blue-900">Selected: Table {selectedTable.table_number}</h3>
                                    <p className="text-sm text-blue-700">Capacity: {selectedTable.capacity} people</p>
                                </div>
                            )}
                        </div>

                        {/* Cart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">🛒 Order Cart</h2>
                            
                            {cart.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No items in cart</p>
                                    <p className="text-sm text-gray-400">Add items from the menu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                <p className="text-sm text-gray-500">₹{item.price} each</p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 ml-2"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center text-lg font-semibold">
                                            <span>Total:</span>
                                            <span>₹{getTotalAmount().toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={submitOrder}
                                        disabled={!selectedTable || cart.length === 0}
                                        className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        📝 Place Order ({cart.length} items)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-medium text-gray-900">🍽️ Menu Items</h2>
                                
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    {menuCategories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <span className="text-lg font-semibold text-green-600">₹{item.price}</span>
                                        </div>
                                        
                                        {item.description && (
                                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                        )}
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {item.is_veg && (
                                                    <span className="text-green-600 text-sm">🟢 Veg</span>
                                                )}
                                                {item.is_spicy && (
                                                    <span className="text-red-600 text-sm">🌶️</span>
                                                )}
                                            </div>
                                            
                                            <button
                                                onClick={() => addToCart(item)}
                                                disabled={!selectedTable}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredItems.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No menu items available</p>
                                    <p className="text-sm text-gray-400 mt-1">Please check your connection or try refreshing</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withRoleGuard(MobileOrdering, ['waiter', 'staff', 'admin']);
