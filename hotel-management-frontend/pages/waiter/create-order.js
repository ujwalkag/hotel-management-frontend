import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import { useRouter } from 'next/router';
import Link from 'next/link';

function CreateOrder() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState(router.query.table || '');
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('Guest');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.access) return;
    
    try {
      const [tablesRes, menuRes] = await Promise.all([
        fetch('/api/tables/tables/', {
          headers: { Authorization: `Bearer ${user.access}` }
        }),
        fetch('/api/menu/items/', {
          headers: { Authorization: `Bearer ${user.access}` }
        })
      ]);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(Array.isArray(tablesData) ? tablesData : []);
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        const items = Array.isArray(menuData) ? menuData : (menuData.results || []);
        setMenuItems(items.filter(item => item.available));
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (menuItem) => {
    const existingItem = orderItems.find(item => item.menu_item.id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menu_item.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        menu_item: menuItem,
        quantity: 1,
        price: parseFloat(menuItem.price)
      }]);
    }
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.menu_item.id !== menuItemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item.menu_item.id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => 
      total + (item.quantity * item.price), 0
    );
  };

  const submitOrder = async () => {
    if (!selectedTable || orderItems.length === 0) {
      alert('Please select a table and add items');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        table: parseInt(selectedTable),
        customer_name: customerName,
        customer_count: 1,
        items: orderItems.map(item => ({
          menu_item: item.menu_item.id,
          quantity: item.quantity,
          special_instructions: ''
        }))
      };

      const response = await fetch('/api/tables/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Order created successfully!\nOrder #${result.order_number || result.id}`);
        router.push('/waiter');
      } else {
        const error = await response.json();
        console.error('Order creation error:', error);
        alert('❌ Error creating order: ' + (error.detail || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('❌ Network error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <Link href="/waiter" className="text-blue-600 text-sm">← Back</Link>
          <h1 className="text-lg font-bold">Create Order</h1>
          <div></div>
        </div>
      </div>

      <div className="p-4 max-w-sm mx-auto pb-24">
        {/* Customer Name */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <label className="block font-medium mb-2">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Guest name"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Table Selection */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <label className="block font-medium mb-2">Select Table *</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full p-3 border rounded-lg text-lg"
          >
            <option value="">Choose Table</option>
            {tables.filter(t => !t.is_occupied).map(table => (
              <option key={table.id} value={table.id}>
                Table {table.table_number} ({table.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h3 className="font-bold mb-3">Menu Items</h3>
          
          {menuItems.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {menuItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name_en}</div>
                    {item.name_hi && <div className="text-sm text-gray-600">{item.name_hi}</div>}
                    <div className="text-green-600 font-bold">₹{parseFloat(item.price).toFixed(0)}</div>
                  </div>
                  <button
                    onClick={() => addToOrder(item)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No menu items available</p>
          )}
        </div>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-bold mb-3">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {orderItems.map(item => (
                <div key={item.menu_item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{item.menu_item.name_en}</div>
                    <div className="text-sm text-gray-600">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t">
          <div className="max-w-sm mx-auto">
            <button
              onClick={submitOrder}
              disabled={!selectedTable || orderItems.length === 0 || submitting}
              className={`w-full py-4 rounded-lg text-lg font-bold ${
                submitting 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {submitting ? 'Creating Order...' : `Place Order (₹${calculateTotal().toFixed(0)})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(CreateOrder, ['admin', 'staff']);
