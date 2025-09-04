
// pages/waiter/mobile-orders.js - Complete Mobile Waiter Interface
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

function EnhancedWaiterOrders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Guest',
    phone: '',
    count: 1
  });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('tables'); // 'tables', 'menu', 'cart'

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user?.access) return;

    try {
      setLoading(true);

      const [tablesRes, menuRes, categoriesRes] = await Promise.all([
        fetch('/api/tables/mobile/tables_layout/', {
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
        setMenuItems(items.filter(item => item.available));
      }

      if (categoriesRes.ok) {
        const categoryData = await categoriesRes.json();
        setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menu_item.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.menu_item.id === menuItem.id 
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
      setCart(cart.filter(item => item.menu_item.id !== menuItemId));
    } else {
      setCart(cart.map(item => 
        item.menu_item.id === menuItemId ? { ...item, quantity } : item
      ));
    }
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

      const response = await fetch('/api/tables/mobile/create_order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Order created successfully! Order #${result.order_number || result.id}`);

        // Reset form
        setCart([]);
        setSelectedTable(null);
        setCustomerInfo({ name: 'Guest', phone: '', count: 1 });
        setView('tables');

        // Refresh tables
        fetchInitialData();
      } else {
        const error = await response.json();
        console.error('Order creation error:', error);
        toast.error('Failed to create order: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error creating order');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = selectedCategory 
    ? menuItems.filter(item => item.category?.id === parseInt(selectedCategory))
    : menuItems;

  if (loading && view === 'tables') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📱 Enhanced Waiter Panel</h1>
            <p className="text-sm opacity-90">
              {selectedTable ? `Table ${selectedTable.table_number}` : 'Select a table'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">{user?.email}</p>
            {cart.length > 0 && (
              <p className="text-sm bg-red-500 rounded-full px-2 py-1 inline-block">
                {cart.length} items
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="p-4 bg-white border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setView('tables')}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              view === 'tables' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            🪑 Tables
          </button>
          <button
            onClick={() => setView('menu')}
            disabled={!selectedTable}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              view === 'menu' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            } ${!selectedTable ? 'opacity-50' : ''}`}
          >
            🍽️ Menu
          </button>
          <button
            onClick={() => setView('cart')}
            disabled={cart.length === 0}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              view === 'cart' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            } ${cart.length === 0 ? 'opacity-50' : ''}`}
          >
            🛒 Cart ({cart.length})
          </button>
        </div>
      </div>

      {/* Table Selection View */}
      {view === 'tables' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Select Table</h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => {
                  setSelectedTable(table);
                  setView('menu');
                }}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  table.is_occupied 
                    ? 'border-red-300 bg-red-50 text-red-700 opacity-50'
                    : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
                disabled={table.is_occupied}
              >
                <div className="font-bold text-lg">T{table.table_number}</div>
                <div className="text-sm">
                  {table.is_occupied ? '🔴 Occupied' : '🟢 Available'}
                </div>
                <div className="text-xs mt-1">Cap: {table.capacity}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu View */}
      {view === 'menu' && selectedTable && (
        <div className="flex flex-col h-full">
          {/* Customer Info */}
          <div className="bg-white p-4 border-b">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Guests"
                  value={customerInfo.count}
                  onChange={(e) => setCustomerInfo({...customerInfo, count: parseInt(e.target.value)})}
                  className="border rounded px-3 py-2"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white p-3 border-b">
            <div className="flex overflow-x-auto space-x-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === '' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === category.id.toString() ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {language === 'hi' ? category.name_hi : category.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="space-y-3">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-3 border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {language === 'hi' ? item.name_hi : item.name_en}
                      </h4>
                      {item.description_en && (
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'hi' ? item.description_hi : item.description_en}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-lg text-green-600">₹{item.price}</span>
                        <span className="text-xs text-gray-500">
                          {item.category?.name_en || 'No category'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-500 text-white px-4 py-2 rounded ml-3 hover:bg-blue-600 transition-colors"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart View */}
      {view === 'cart' && cart.length > 0 && (
        <div className="p-4 pb-24">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            {cart.map(item => (
              <div key={item.menu_item.id} className="bg-white rounded-lg p-3 border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {language === 'hi' ? item.menu_item.name_hi : item.menu_item.name_en}
                    </h4>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <input
                    type="text"
                    placeholder="Special instructions..."
                    value={item.special_instructions}
                    onChange={(e) => {
                      setCart(cart.map(cartItem => 
                        cartItem.menu_item.id === item.menu_item.id 
                          ? { ...cartItem, special_instructions: e.target.value }
                          : cartItem
                      ));
                    }}
                    className="text-sm border rounded px-2 py-1 flex-1 mr-2"
                  />
                  <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="text-sm text-gray-600">
                Table {selectedTable?.table_number} • {cart.length} items
              </div>
              <div className="font-bold text-lg">₹{calculateTotal().toFixed(2)}</div>
            </div>
            <button
              onClick={submitOrder}
              disabled={loading}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : '🍳 Send to Kitchen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(EnhancedWaiterOrders, ['admin', 'staff', 'waiter']);

