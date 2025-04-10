// pages/admin/restaurant-orders.js
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function RestaurantOrders() {
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch menu items and existing orders
  useEffect(() => {
    fetchMenuItems();
    fetchOrders();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu-items/');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/restaurant-orders/');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menu_item === itemId);
      if (existing) {
        return prev.map((item) =>
          item.menu_item === itemId ? { ...item, quantity } : item
        );
      } else {
        return [...prev, { menu_item: itemId, quantity }];
      }
    });
  };

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menu_item);
      return total + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);
  };

  const createOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/restaurant-orders/', {
        order_items: orderItems,
        total_price: getTotalPrice(),
      });
      setOrderItems([]);
      fetchOrders(); // Refresh order list
    } catch (error) {
      console.error('Failed to create order:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">🧾 Create Restaurant Order</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg shadow-sm">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-500">₹{item.price}</div>
            <input
              type="number"
              min="0"
              placeholder="Quantity"
              className="mt-2 p-1 border w-24"
              value={
                orderItems.find((oi) => oi.menu_item === item.id)?.quantity || ''
              }
              onChange={(e) =>
                handleQuantityChange(item.id, parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xl font-bold">Total: ₹{getTotalPrice()}</div>
        <button
          onClick={createOrder}
          disabled={loading || orderItems.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Placing...' : 'Place Order'}
        </button>
      </div>

      <hr className="my-6" />

      <h3 className="text-xl font-semibold mb-2">📋 Recent Orders</h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border p-4 rounded-md bg-white shadow-md"
          >
            <div className="text-sm text-gray-600">
              Order ID: #{order.id} — Status: <strong>{order.status}</strong>
            </div>
            <div className="mt-2">
              <ul className="list-disc pl-5 text-sm">
                {order.order_items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity} x {item.menu_item.name} — ₹
                    {item.menu_item.price * item.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2 font-semibold">Total: ₹{order.total_price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

