// Fixed mobile-ordering.js with proper menu loading and professional display
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
        break;

      case 'tables_update':
        setTables(data.tables || []);
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

      // ✅ FIXED: Load data from both old menu API and new restaurant API
      const [tablesRes, menuCategoriesRes, menuItemsRes, restaurantMenuRes] = await Promise.all([
        // Tables from restaurant API
        fetch('/api/restaurant/tables/?available_only=false', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        // Menu categories from old menu API
        fetch('/api/menu/categories/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        // Menu items from old menu API
        fetch('/api/menu/items/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        // Restaurant menu API (if available)
        fetch('/api/restaurant/menu-for-ordering/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }).catch(() => ({ ok: false })) // Don't fail if this endpoint doesn't exist
      ]);

      // Load tables
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      // ✅ FIXED: Load menu from restaurant API first, fallback to old menu API
      if (restaurantMenuRes.ok) {
        try {
          const restaurantMenuData = await restaurantMenuRes.json();
          if (restaurantMenuData && restaurantMenuData.length > 0) {
            // Use restaurant API menu structure
            const categories = restaurantMenuData.map(categoryData => categoryData.category);
            const allItems = restaurantMenuData.flatMap(categoryData => 
              categoryData.items.map(item => ({
                ...item,
                category: categoryData.category
              }))
            );
            
            setMenuCategories(categories);
            setMenuItems(allItems);
            if (categories.length > 0) {
              setSelectedCategory(categories[0].id);
            }
            console.log('✅ Loaded menu from restaurant API');
          } else {
            throw new Error('Empty restaurant menu data');
          }
        } catch (error) {
          console.log('Restaurant menu API failed, using fallback menu API');
          await loadFallbackMenu(menuCategoriesRes, menuItemsRes);
        }
      } else {
        // Fallback to old menu API
        await loadFallbackMenu(menuCategoriesRes, menuItemsRes);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Fallback menu loading function
  const loadFallbackMenu = async (menuCategoriesRes, menuItemsRes) => {
    try {
      // Load categories
      if (menuCategoriesRes.ok) {
        const categoriesData = await menuCategoriesRes.json();
        const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [];
        setMenuCategories(categories);
        if (categories.length > 0) {
          setSelectedCategory(categories[0].id);
        }
        console.log('✅ Loaded categories from menu API:', categories);
      }

      // Load items
      if (menuItemsRes.ok) {
        const itemsData = await menuItemsRes.json();
        const items = Array.isArray(itemsData) ? itemsData : itemsData.results || [];
        // Filter only available items
        const availableItems = items.filter(item => item.available);
        setMenuItems(availableItems);
        console.log('✅ Loaded items from menu API:', availableItems);
      }
    } catch (error) {
      console.error('Error loading fallback menu:', error);
      toast.error('Failed to load menu from fallback API');
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

    toast.success(`Added ${menuItem.name_en || menuItem.name} to cart`);
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
      cleaning: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.free;
  };

  if (isLoading && tables.length === 0 && menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ordering interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {currentStep !== 'table' && (
                <button
                  onClick={goBack}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ←
                </button>
              )}

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📱 Mobile Ordering
                </h1>
                {selectedTable && (
                  <p className="text-sm text-gray-600">
                    Table {selectedTable.table_number}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Cart badge */}
              {cart.length > 0 && (
                <button
                  onClick={() => setCurrentStep('cart')}
                  className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>🛒</span>
                  <span>Cart ({cart.length})</span>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Table / टेबल चुनें
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => selectTable(table)}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Table {table.table_number}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                      {table.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Capacity: {table.capacity} people
                  </p>
                  {table.location && (
                    <p className="text-xs text-gray-500 mt-1">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select Items / आइटम चुनें
              </h2>
              <p className="text-sm text-gray-600">
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
              <div className="flex overflow-x-auto space-x-2 pb-2">
                {menuCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name_en || category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Debug Information */}
            {menuCategories.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ No menu categories found. Please add categories in the admin panel.
                </p>
              </div>
            )}

            {/* Menu Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredMenuItems().map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Item Image */}
                    {item.image && (
                      <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name_en || item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name_en || item.name}
                        {item.is_veg && <span className="ml-2 text-green-600">🟢</span>}
                        {item.is_spicy && <span className="ml-1 text-red-600">🌶️</span>}
                      </h3>
                    </div>

                    {(item.description_en || item.description) && (
                      <p className="text-sm text-gray-600 mb-3">
                        {item.description_en || item.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(item.price)}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>

                    {item.preparation_time && (
                      <p className="text-xs text-gray-500 mt-2">
                        ~{item.preparation_time}m prep time
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {getFilteredMenuItems().length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items found
                </h3>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Cart / कार्ट ({cart.length} items)
              </h2>
              <p className="text-sm text-gray-600">
                Table {selectedTable?.table_number}
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <button
                  onClick={() => setCurrentStep('menu')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Items
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.menu_item.name_en || item.menu_item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.menu_item.price)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menu_item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.menu_item.id, {
                              quantity: item.quantity + 1
                            })}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
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

                      {/* Total for this item */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(item.menu_item.price * item.quantity)}
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="mt-4">
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
                  </div>
                ))}

                {/* Total */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('menu')}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Add More Items
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
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
