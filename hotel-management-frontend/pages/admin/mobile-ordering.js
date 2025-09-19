// pages/admin/mobile-ordering.js - COMPLETE Mobile Ordering with ALL Fixes
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function MobileOrderingInterface() {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [menuCategories, setMenuCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [cart, setCart] = useState([]);
    const [currentStep, setCurrentStep] = useState('table'); // table, menu, cart, confirm
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    // WebSocket connection with proper error handling
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
            const wsUrl = `${protocol}//${window.location.host}/ws/ordering/`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                console.log('✅ Ordering WebSocket connected');
                toast.success('Connected to ordering system');
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                console.log('❌ Ordering WebSocket disconnected');
                // Attempt to reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
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
            toast.error('Failed to connect to ordering system');
        }
    };

    const handleWebSocketMessage = (data) => {
        console.log('📨 WebSocket message received:', data);
        
        switch (data.type) {
            case 'initial_ordering_data':
                if (data.tables) setTables(data.tables);
                break;

            case 'tables_update':
                if (data.tables) setTables(data.tables);
                break;

            case 'table_status_changed':
                setTables(prev => prev.map(table =>
                    table.id === data.table.id ? data.table : table
                ));
                break;

            case 'order_confirmed':
                if (data.table_id === selectedTable?.id) {
                    toast.success('🍽️ Order confirmed in kitchen!');
                }
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const loadInitialData = async () => {
        try {
            setIsLoading(true);

            // Load data from restaurant API first, with proper fallback
            const [tablesRes, restaurantMenuRes] = await Promise.all([
                fetch('/api/restaurant/tables/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                }),
                fetch('/api/restaurant/menu-for-ordering/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                }).catch(() => ({ ok: false }))
            ]);

            // Load tables
            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                setTables(tablesData);
                console.log('✅ Loaded tables:', tablesData.length);
            }

            // Load menu from restaurant API with proper structure handling
            if (restaurantMenuRes.ok) {
                try {
                    const restaurantMenuData = await restaurantMenuRes.json();
                    console.log('📋 Restaurant menu data:', restaurantMenuData);
                    
                    if (restaurantMenuData && restaurantMenuData.length > 0) {
                        // Extract categories and items from restaurant API response
                        const categories = restaurantMenuData.map(categoryData => ({
                            id: categoryData.id,
                            name: categoryData.name,
                            description: categoryData.description,
                            icon: categoryData.icon || '🍽️'
                        }));
                        
                        const allItems = restaurantMenuData.flatMap(categoryData => 
                            categoryData.items.map(item => ({
                                ...item,
                                category_id: categoryData.id
                            }))
                        );
                        
                        setMenuCategories(categories);
                        setMenuItems(allItems);
                        if (categories.length > 0) {
                            setSelectedCategory(categories[0].id);
                        }
                        console.log('✅ Loaded from restaurant API - Categories:', categories.length, 'Items:', allItems.length);
                    } else {
                        throw new Error('Empty restaurant menu data');
                    }
                } catch (error) {
                    console.log('⚠️ Restaurant menu API failed, trying fallback:', error.message);
                    await loadFallbackMenu();
                }
            } else {
                console.log('⚠️ Restaurant menu API not available, using fallback');
                await loadFallbackMenu();
            }

        } catch (error) {
            console.error('❌ Error loading data:', error);
            toast.error('Failed to load menu data. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback menu loading with proper error handling
    const loadFallbackMenu = async () => {
        try {
            const [menuCategoriesRes, menuItemsRes] = await Promise.all([
                fetch('/api/menu/categories/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                }),
                fetch('/api/menu/items/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                })
            ]);

            // Load categories
            if (menuCategoriesRes.ok) {
                const categoriesData = await menuCategoriesRes.json();
                const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [];
                setMenuCategories(categories);
                if (categories.length > 0) {
                    setSelectedCategory(categories[0].id);
                }
                console.log('✅ Loaded fallback categories:', categories.length);
            }

            // Load items
            if (menuItemsRes.ok) {
                const itemsData = await menuItemsRes.json();
                const items = Array.isArray(itemsData) ? itemsData : itemsData.results || [];
                // Filter only available items
                const availableItems = items.filter(item => 
                    item.available !== false && item.availability !== 'out_of_stock'
                );
                setMenuItems(availableItems);
                console.log('✅ Loaded fallback items:', availableItems.length);
            }
        } catch (error) {
            console.error('❌ Error loading fallback menu:', error);
            toast.error('Failed to load menu from fallback API');
        }
    };

    const selectTable = (table) => {
        setSelectedTable(table);
        setCurrentStep('menu');
        toast.success(`✅ Selected Table ${table.table_number}`);
    };

    const addToCart = (menuItem, quantity = 1) => {
        const existingItem = cart.find(item => item.menu_item.id === menuItem.id);

        if (existingItem) {
            setCart(prev => prev.map(item =>
                item.menu_item.id === menuItem.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            setCart(prev => [...prev, {
                menu_item: menuItem,
                quantity: quantity,
                special_instructions: '',
                priority: 'normal'
            }]);
        }

        toast.success(`➕ Added ${menuItem.name || menuItem.name_en} to cart`);
    };

    const updateCartItem = (menuItemId, updates) => {
        setCart(prev => prev.map(item =>
            item.menu_item.id === menuItemId
                ? { ...item, ...updates }
                : item
        ));
    };

    const removeFromCart = (menuItemId) => {
        setCart(prev => prev.filter(item => item.menu_item.id !== menuItemId));
        toast.success('🗑️ Item removed from cart');
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => {
            return total + (item.menu_item.price * item.quantity);
        }, 0);
    };

    // Submit order with proper API endpoint and error handling
    const submitOrder = async () => {
        if (!selectedTable || cart.length === 0) {
            toast.error('❌ Please select a table and add items to cart');
            return;
        }

        try {
            setIsLoading(true);

            // Use restaurant API bulk_create endpoint
            const orderData = {
                table: selectedTable.id,
                orders: cart.map(item => ({
                    menu_item_id: item.menu_item.id,  // Use menu_item_id
                    quantity: item.quantity,
                    special_instructions: item.special_instructions || '',
                    priority: item.priority || 'normal'
                }))
            };

            console.log('📤 Submitting order:', orderData);

            const response = await fetch('/api/restaurant/orders/bulk_create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Order submitted successfully:', result);
                
                toast.success(
                    `🎉 Order placed successfully!\n` +
                    `${result.orders?.length || cart.length} items ordered for Table ${selectedTable.table_number}\n` +
                    `${result.kds_status === 'connected' ? '✅ Sent to kitchen' : '⚠️ Saved (kitchen offline)'}`,
                    { duration: 6000 }
                );

                // Reset the interface
                setCart([]);
                setSelectedTable(null);
                setCurrentStep('table');

                // Refresh tables to update occupancy
                loadInitialData();
            } else {
                const error = await response.json();
                console.error('❌ Order submission failed:', error);
                toast.error(`❌ Failed to place order: ${error.detail || error.error || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('❌ Network error placing order:', error);
            toast.error('❌ Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getFilteredMenuItems = () => {
        if (!selectedCategory || !menuItems.length) return [];

        // Filter items by selected category
        let filteredItems = menuItems.filter(item => {
            // Handle both old API structure (item.category.id) and new API structure
            const categoryId = item.category?.id || item.category_id;
            return categoryId === selectedCategory;
        });

        // Apply search filter if search query exists
        if (searchQuery) {
            filteredItems = filteredItems.filter(item =>
                (item.name_en && item.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.name_hi && item.name_hi.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.description_en && item.description_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        return filteredItems;
    };

    const goBack = () => {
        switch (currentStep) {
            case 'menu':
                setCurrentStep('table');
                setSelectedTable(null);
                break;
            case 'cart':
                setCurrentStep('menu');
                break;
            case 'confirm':
                setCurrentStep('cart');
                break;
            default:
                break;
        }
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
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

    if (isLoading && tables.length === 0 && menuItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading ordering interface...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {currentStep !== 'table' && (
                            <button
                                onClick={goBack}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                ← Back
                            </button>
                        )}

                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-semibold text-gray-900">
                                📱 Mobile Ordering
                            </h1>
                            {selectedTable && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Table {selectedTable.table_number}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Connection status */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            </span>

                            {/* Cart badge */}
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCurrentStep('cart')}
                                    className="relative inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    🛒 Cart ({cart.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Table Selection */}
                {currentStep === 'table' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">
                                Select a Table / टेबल चुनें
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    onClick={() => selectTable(table)}
                                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Table {table.table_number}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTableStatusColor(table.status)}`}>
                                            {table.status}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 mb-2">
                                        Capacity: {table.capacity} people
                                    </p>

                                    {table.location && (
                                        <p className="text-sm text-gray-500 mb-2">
                                            📍 {table.location}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Selection */}
                {currentStep === 'menu' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">
                                Select Items / आइटम चुनें
                            </h2>
                            <p className="text-sm text-gray-500">
                                Table {selectedTable?.table_number}
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Categories */}
                        <div className="mb-6">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {menuCategories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
                                            selectedCategory === category.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.icon} {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Debug Information */}
                        {menuCategories.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800">
                                    ⚠️ No menu categories found. Please add categories in the admin panel.
                                </p>
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getFilteredMenuItems().map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4"
                                >
                                    {/* Item Image */}
                                    {item.image && (
                                        <div className="mb-3">
                                            <img 
                                                src={item.image} 
                                                alt={item.name_en || item.name}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {item.name_en || item.name}
                                            {item.is_veg && ' 🟢'}
                                            {item.is_spicy && ' 🌶️'}
                                        </h3>
                                    </div>

                                    {(item.description_en || item.description) && (
                                        <p className="text-xs text-gray-500 mb-3">
                                            {item.description_en || item.description}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(item.price)}
                                        </span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>

                                    {item.preparation_time && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            ~{item.preparation_time}m prep time
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {getFilteredMenuItems().length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🍽️</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                                <p className="text-gray-500">
                                    {searchQuery 
                                        ? 'Try adjusting your search or selecting a different category'
                                        : 'No items available in this category'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Cart */}
                {currentStep === 'cart' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">
                                Cart / कार्ट ({cart.length} items)
                            </h2>
                            <p className="text-sm text-gray-500">
                                Table {selectedTable?.table_number}
                            </p>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🛒</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                                <button
                                    onClick={() => setCurrentStep('menu')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Browse Menu
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {item.menu_item.name_en || item.menu_item.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {formatCurrency(item.menu_item.price)} each
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.menu_item.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            {/* Quantity */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Quantity
                                                </label>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => updateCartItem(item.menu_item.id, {
                                                            quantity: Math.max(1, item.quantity - 1)
                                                        })}
                                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartItem(item.menu_item.id, {
                                                            quantity: item.quantity + 1
                                                        })}
                                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Priority */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Priority
                                                </label>
                                                <select
                                                    value={item.priority}
                                                    onChange={(e) => updateCartItem(item.menu_item.id, {
                                                        priority: e.target.value
                                                    })}
                                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-xs"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>

                                            {/* Total for this item */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Total
                                                </label>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(item.menu_item.price * item.quantity)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Instructions */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Special Instructions
                                            </label>
                                            <textarea
                                                value={item.special_instructions}
                                                onChange={(e) => updateCartItem(item.menu_item.id, {
                                                    special_instructions: e.target.value
                                                })}
                                                placeholder="Any special requests..."
                                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-xs"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center text-lg font-semibold">
                                        <span>Total Amount:</span>
                                        <span>{formatCurrency(getTotalAmount())}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setCurrentStep('menu')}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Add More Items
                                    </button>
                                    <button
                                        onClick={submitOrder}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Role guard for waiters, admins, and managers
export default withRoleGuard(MobileOrderingInterface, ['admin', 'waiter', 'manager']);
