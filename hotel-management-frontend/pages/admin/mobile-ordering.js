// pages/admin/mobile-ordering.js - Mobile Ordering Interface
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function MobileOrderingInterface() {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [cart, setCart] = useState([]);
    const [currentStep, setCurrentStep] = useState('table'); // table, menu, cart, confirm
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    // WebSocket connection
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
                console.log('Ordering WebSocket connected');
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
            case 'initial_ordering_data':
                setTables(data.tables || []);
                setMenu(data.menu || []);
                break;

            case 'tables_update':
                setTables(data.tables || []);
                break;

            case 'menu_update':
                setMenu(data.menu || []);
                break;

            case 'table_status_changed':
                setTables(prev => prev.map(table =>
                    table.id === data.table.id ? data.table : table
                ));
                break;

            case 'order_confirmed':
                if (data.table_id === selectedTable?.id) {
                    toast.success('Order confirmed in kitchen!');
                }
                break;
        }
    };

    const loadInitialData = async () => {
        try {
            setIsLoading(true);

            const [tablesRes, menuRes] = await Promise.all([
                fetch('/api/restaurant/tables/?available_only=false', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                }),
                fetch('/api/restaurant/menu-for-ordering/', {
                    headers: { Authorization: `Bearer ${user?.access}` }
                })
            ]);

            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                setTables(tablesData);
            }

            if (menuRes.ok) {
                const menuData = await menuRes.json();
                setMenu(menuData);
                if (menuData.length > 0) {
                    setSelectedCategory(menuData[0].category.id);
                }
            }

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const selectTable = (table) => {
        setSelectedTable(table);
        setCurrentStep('menu');
        toast.success(`Selected Table ${table.table_number}`);
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

        toast.success(`Added ${menuItem.name} to cart`);
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
        toast.success('Item removed from cart');
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => {
            return total + (item.menu_item.price * item.quantity);
        }, 0);
    };

    const submitOrder = async () => {
        if (!selectedTable || cart.length === 0) {
            toast.error('Please select a table and add items to cart');
            return;
        }

        try {
            setIsLoading(true);

            const orderData = {
                table: selectedTable.id,
                orders: cart.map(item => ({
                    menu_item: item.menu_item.id,
                    quantity: item.quantity,
                    special_instructions: item.special_instructions || '',
                    priority: item.priority || 'normal'
                }))
            };

            const response = await fetch('/api/restaurant/orders/bulk_create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const orders = await response.json();
                toast.success(`Order placed successfully! ${orders.length} items ordered.`);

                // Reset the interface
                setCart([]);
                setSelectedTable(null);
                setCurrentStep('table');

                // Refresh tables to update occupancy
                loadInitialData();
            } else {
                const error = await response.json();
                toast.error(`Failed to place order: ${error.detail || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getFilteredMenuItems = () => {
        if (!selectedCategory) return [];

        const categoryData = menu.find(cat => cat.category.id === selectedCategory);
        if (!categoryData) return [];

        let items = categoryData.items;

        if (searchQuery) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return items;
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
            cleaning: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || colors.free;
    };

    if (isLoading && tables.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
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
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {currentStep !== 'table' && (
                                <button
                                    onClick={goBack}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}

                            <div>
                                <h1 className="text-xl font-bold text-gray-800">
                                    📱 Mobile Ordering
                                </h1>
                                {selectedTable && (
                                    <p className="text-sm text-gray-600">
                                        Table {selectedTable.table_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Connection status */}
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>

                            {/* Cart badge */}
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCurrentStep('cart')}
                                    className="relative p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    🛒
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Table Selection */}
                {currentStep === 'table' && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Select a Table / टेबल चुनें
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => selectTable(table)}
                                    disabled={!table.is_available && table.status !== 'free'}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        table.is_available || table.status === 'free'
                                            ? 'hover:border-blue-500 hover:shadow-md bg-white'
                                            : 'opacity-50 cursor-not-allowed bg-gray-100'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800 mb-2">
                                            {table.table_number}
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                                            {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Capacity: {table.capacity}
                                        </div>
                                        {table.active_orders_count > 0 && (
                                            <div className="text-xs text-orange-600 mt-1">
                                                {table.active_orders_count} active orders
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Selection */}
                {currentStep === 'menu' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Select Items / आइटम चुनें
                            </h2>
                            <span className="text-sm text-gray-600">
                                Table {selectedTable?.table_number}
                            </span>
                        </div>

                        {/* Search */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                            {menu.map(categoryData => (
                                <button
                                    key={categoryData.category.id}
                                    onClick={() => setSelectedCategory(categoryData.category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedCategory === categoryData.category.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {categoryData.category.icon} {categoryData.category.name}
                                </button>
                            ))}
                        </div>

                        {/* Menu Items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getFilteredMenuItems().map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                {item.name}
                                                {item.is_veg && <span className="text-green-500 ml-1">🟢</span>}
                                                {item.is_spicy && <span className="text-red-500 ml-1">🌶️</span>}
                                            </h3>
                                            {item.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatCurrency(item.price)}
                                            </div>
                                        </div>

                                        {item.image_url && (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg ml-3"
                                            />
                                        )}
                                    </div>

                                    {item.allergens_list && item.allergens_list.length > 0 && (
                                        <div className="text-xs text-gray-500 mb-2">
                                            Allergens: {item.allergens_list.join(', ')}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                            ~{item.preparation_time}m prep
                                        </span>

                                        <button
                                            onClick={() => addToCart(item)}
                                            disabled={!item.is_available}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                item.is_available
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {item.is_available ? 'Add to Cart' : 'Unavailable'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {getFilteredMenuItems().length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No items found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Cart */}
                {currentStep === 'cart' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Cart / कार्ट ({cart.length} items)
                            </h2>
                            <span className="text-sm text-gray-600">
                                Table {selectedTable?.table_number}
                            </span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">🛒</div>
                                <p className="text-gray-500 mb-4">Your cart is empty</p>
                                <button
                                    onClick={() => setCurrentStep('menu')}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Browse Menu
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">
                                                    {item.menu_item.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(item.menu_item.price)} each
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.menu_item.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Quantity */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quantity
                                                </label>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => updateCartItem(item.menu_item.id, {
                                                            quantity: Math.max(1, item.quantity - 1)
                                                        })}
                                                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartItem(item.menu_item.id, {
                                                            quantity: item.quantity + 1
                                                        })}
                                                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Priority */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Priority
                                                </label>
                                                <select
                                                    value={item.priority}
                                                    onChange={(e) => updateCartItem(item.menu_item.id, {
                                                        priority: e.target.value
                                                    })}
                                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Special Instructions */}
                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Special Instructions
                                            </label>
                                            <textarea
                                                value={item.special_instructions}
                                                onChange={(e) => updateCartItem(item.menu_item.id, {
                                                    special_instructions: e.target.value
                                                })}
                                                placeholder="Any special requests..."
                                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                            />
                                        </div>

                                        <div className="mt-3 text-right">
                                            <span className="text-lg font-bold text-blue-600">
                                                {formatCurrency(item.menu_item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-800">
                                            Total Amount:
                                        </span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(getTotalAmount())}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setCurrentStep('menu')}
                                        className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                    >
                                        Add More Items
                                    </button>

                                    <button
                                        onClick={submitOrder}
                                        disabled={isLoading}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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

export default withRoleGuard(MobileOrderingInterface, ['admin', 'waiter', 'manager']);

