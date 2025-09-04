// components/mobile/WaiterOrderTaking.js - Mobile Waiter Interface
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const WaiterOrderTaking = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    count: 1
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchMenu();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables/mobile/tables_layout/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu/items/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await response.json();
      setMenuItems(data.results || data);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category?.name_en).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...menuItem, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      alert('Please select a table and add items to cart');
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
          menu_item_id: item.id,
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

      const result = await response.json();

      if (result.success) {
        alert('Order sent to kitchen successfully!');
        setCart([]);
        setSelectedTable(null);
        setCustomerInfo({ name: '', phone: '', count: 1 });
        fetchTables(); // Refresh table status
      } else {
        alert('Failed to create order: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category?.name_en === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">📱 Waiter Order Taking</h1>
        <p className="text-sm opacity-90">Select table → Add items → Send to kitchen</p>
      </div>

      {/* Table Selection */}
      {!selectedTable && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">🪑 Select Table</h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 rounded-lg border-2 text-center transition-colors $\{
                  table.is_occupied 
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
                disabled={table.is_occupied}
              >
                <div className="font-bold">Table {table.table_number}</div>
                <div className="text-sm">
                  {table.is_occupied ? '🔴 Occupied' : '🟢 Available'}
                </div>
                <div className="text-xs">Capacity: {table.capacity}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Taking Interface */}
      {selectedTable && (
        <div className="flex flex-col h-full">
          {/* Selected Table Info */}
          <div className="bg-white p-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Table {selectedTable.table_number}</h2>
                <p className="text-sm text-gray-600">Capacity: {selectedTable.capacity}</p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                Change Table
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white p-4 border-b">
            <h3 className="font-semibold mb-2">👥 Customer Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <input
              type="number"
              placeholder="Number of Guests"
              value={customerInfo.count}
              onChange={(e) => setCustomerInfo({...customerInfo, count: parseInt(e.target.value)})}
              className="border rounded px-2 py-1 text-sm mt-2 w-full"
              min="1"
            />
          </div>

          {/* Category Filter */}
          <div className="bg-white p-2 border-b">
            <div className="flex overflow-x-auto space-x-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap $\{
                  selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap $\{
                    selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-3 border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name_en}</h4>
                      {item.name_hi && (
                        <p className="text-sm text-gray-600">{item.name_hi}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{item.description_en}</p>
                      <p className="font-bold text-lg text-green-600 mt-2">₹{item.price}</p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="bg-white border-t p-4">
              <h3 className="font-semibold mb-2">🛒 Order Summary ({cart.length} items)</h3>
              <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>{item.name_en}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 rounded text-xs"
                      >
                        +
                      </button>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={submitOrder}
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 rounded-lg mt-3 font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Sending to Kitchen...' : '🍳 Send to Kitchen'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WaiterOrderTaking;

