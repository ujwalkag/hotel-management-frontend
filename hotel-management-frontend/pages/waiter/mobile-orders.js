import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

function EnhancedMobileOrders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Guest',
    phone: '',
    count: 1
  });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('tables'); // 'tables', 'menu', 'cart', 'existing'

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user?.access) return;

    try {
      setLoading(true);

      // Fetch all required data
      const [tablesRes, menuRes, categoriesRes] = await Promise.all([
        fetch('/api/tables/', {
          headers: { Authorization: `Bearer ${user.access}` }
        }),
        fetch('/api/menu/items/', {
          headers: { Authorization: `Bearer ${user.access}` }
        }),
        fetch('/api/menu/categories/', {
          headers: { Authorization: `Bearer ${user.access}` }
        })
      ]);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(Array.isArray(tablesData) ? tablesData : tablesData.results || []);
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        const items = Array.isArray(menuData) ? menuData : menuData.results || [];
        setMenuItems(items.filter(item => item.available !== false));
      }

      if (categoriesRes.ok) {
        const categoryData = await categoriesRes.json();
        const cats = Array.isArray(categoryData) ? categoryData : categoryData.results || [];
        setCategories(cats);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingOrder = async (tableId) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/current-order/`, {
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        const orderData = await response.json();
        setCurrentOrder(orderData);
        setCart(orderData.items || []);
        setCustomerInfo({
          name: orderData.customer_name || 'Guest',
          phone: orderData.customer_phone || '',
          count: orderData.customer_count || 1
        });
      }
    } catch (error) {
      console.error('Error fetching existing order:', error);
    }
  };

  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    
    if (table.is_occupied && table.current_order) {
      // Table has existing order, fetch it
      await fetchExistingOrder(table.id);
      setView('existing');
    } else {
      // New table, start fresh
      setCurrentOrder(null);
      setCart([]);
      setCustomerInfo({ name: 'Guest', phone: '', count: 1 });
      setView('menu');
    }
  };

  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menu_item?.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.menu_item?.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        menu_item: menuItem, 
        quantity: 1, 
        price: parseFloat(menuItem.price),
        special_instructions: ''
      }]);
    }
    toast.success(`${menuItem.name_en} added to cart`);
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.menu_item?.id !== menuItemId));
    } else {
      setCart(cart.map(item => 
        item.menu_item?.id === menuItemId ? { ...item, quantity } : item
      ));
    }
  };

  const updateItemInstructions = (menuItemId, instructions) => {
    setCart(cart.map(item => 
      item.menu_item?.id === menuItemId 
        ? { ...item, special_instructions: instructions }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      toast.error('Please select a table and add items to cart');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        table_id: selectedTable.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_count: customerInfo.count,
        items: cart.map(item => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || ''
        }))
      };

      const apiUrl = currentOrder 
        ? `/api/tables/orders/${currentOrder.id}/add-items/`
        : '/api/tables/orders/create/';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          currentOrder 
            ? 'Items added to existing order!' 
            : `New order created! Order #${result.order_number || result.order_id}`
        );

        // Reset state
        setCart([]);
        setSelectedTable(null);
        setCurrentOrder(null);
        setCustomerInfo({ name: 'Guest', phone: '', count: 1 });
        setView('tables');

        // Refresh tables
        fetchInitialData();
      } else {
        const error = await response.json();
        console.error('Order creation/update error:', error);
        toast.error('Failed to process order: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error processing order');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = selectedCategory 
    ? menuItems.filter(item => item.category?.id === parseInt(selectedCategory))
    : menuItems;

  if (loading && view === 'tables') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">📱 Enhanced Waiter Panel</h1>
              <p className="text-sm text-gray-600">
                {selectedTable 
                  ? `Table ${selectedTable.table_number} ${currentOrder ? '(Existing Order)' : '(New Order)'}`
                  : 'Select a table'
                }
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500">{user?.email}</p>
              {cart.length > 0 && (
                <p className="text-xs text-blue-600 font-medium">
                  {cart.length} items - ₹{calculateTotal().toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex border-t bg-gray-50">
          <button 
            onClick={() => setView('tables')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${view === 'tables' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          >
            🪑 Tables
          </button>
          {selectedTable && (
            <>
              {currentOrder && (
                <button 
                  onClick={() => setView('existing')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${view === 'existing' ? 'bg-orange-100 text-orange-700' : 'text-gray-600'}`}
                >
                  📋 Current Order
                </button>
              )}
              <button 
                onClick={() => setView('menu')}
                className={`flex-1 py-2 px-4 text-sm font-medium ${view === 'menu' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
              >
                🍽️ Menu
              </button>
              {cart.length > 0 && (
                <button 
                  onClick={() => setView('cart')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${view === 'cart' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                >
                  🛒 Cart ({cart.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table Selection View */}
      {view === 'tables' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Select Table</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  table.is_occupied 
                    ? 'border-orange-300 bg-orange-50 text-orange-800' 
                    : 'border-green-200 bg-green-50 text-green-700 hover:border-green-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {table.is_occupied ? '🟠' : '🟢'}
                  </div>
                  <div className="font-bold">Table {table.table_number}</div>
                  <div className="text-xs mt-1">
                    Capacity: {table.capacity} | {table.location}
                  </div>
                  <div className="text-xs mt-1">
                    {table.is_occupied ? 'Has Order - Add Items' : 'Available - New Order'}
                  </div>
                  {table.current_order && (
                    <div className="text-xs mt-1 text-blue-600">
                      Order #{table.current_order.order_number}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing Order View */}
      {view === 'existing' && currentOrder && (
        <div className="p-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-orange-800 mb-2">📋 Current Order Details</h3>
            <div className="text-sm text-orange-700">
              <p>Order #{currentOrder.order_number}</p>
              <p>Customer: {currentOrder.customer_name} | Phone: {currentOrder.customer_phone}</p>
              <p>Status: {currentOrder.status} | Total: ₹{currentOrder.total_amount}</p>
              <p>Created: {new Date(currentOrder.created_at).toLocaleString()}</p>
            </div>
          </div>

          <h3 className="font-medium mb-3">Current Items in Order:</h3>
          <div className="space-y-3 mb-4">
            {currentOrder.items?.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{item.menu_item?.name_en}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-sm text-blue-600">Note: {item.special_instructions}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    <p className={`text-xs px-2 py-1 rounded ${
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">💡 You can add more items to this existing order</p>
            <p className="text-blue-700 text-sm">Switch to Menu tab to browse and add items</p>
          </div>
        </div>
      )}

      {/* Menu View */}
      {view === 'menu' && selectedTable && (
        <div className="p-4">
          {/* Customer Info (only for new orders) */}
          {!currentOrder && (
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-medium mb-3">Customer Information</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Customer count"
                  value={customerInfo.count}
                  onChange={(e) => setCustomerInfo({...customerInfo, count: parseInt(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {language === 'hi' ? category.name_hi : category.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🍽️</div>
                <p>No menu items available</p>
              </div>
            ) : (
              filteredMenuItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {language === 'hi' ? item.name_hi : item.name_en}
                      </h4>
                      {item.description_en && (
                        <p className="text-sm text-gray-600 mt-1">
                          {language === 'hi' ? item.description_hi : item.description_en}
                        </p>
                      )}
                      <p className="text-lg font-bold text-green-600 mt-2">₹{item.price}</p>
                      <p className="text-xs text-gray-500">{item.category?.name_en || 'No category'}</p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cart View */}
      {view === 'cart' && cart.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">
            {currentOrder ? 'Adding to Existing Order' : 'New Order Summary'}
          </h2>
          
          <div className="space-y-3 mb-6">
            {cart.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {language === 'hi' ? item.menu_item?.name_hi : item.menu_item?.name_en}
                    </h4>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                      className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                      className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Special instructions"
                    value={item.special_instructions}
                    onChange={(e) => updateItemInstructions(item.menu_item.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1 flex-1"
                  />
                  <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">
                Table {selectedTable?.table_number} • {cart.length} items
              </p>
              <p className="font-bold">₹{calculateTotal().toFixed(2)}</p>
            </div>
            <button
              onClick={submitOrder}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : (currentOrder ? '➕ Add to Order' : '🚀 Send to Kitchen')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(EnhancedMobileOrders, ['admin', 'staff', 'waiter']);

