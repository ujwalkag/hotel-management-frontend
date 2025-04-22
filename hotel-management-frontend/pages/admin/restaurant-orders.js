// pages/admin/restaurant-orders.js
import { useEffect, useState } from 'react';
import withRoleGuard from '@/utils/withRoleGuard';
import axios from '@/utils/axiosInstance';

function RestaurantOrders() {
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/admin/restaurant-orders/');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch restaurant orders:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Restaurant Orders</h1>
      <table className="w-full border text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Order ID</th>
            <th className="border px-4 py-2">Items</th>
            <th className="border px-4 py-2">Total</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="border px-4 py-2">{order.id}</td>
              <td className="border px-4 py-2">
                {order.items.map(item => (
                  <div key={item.id}>{item.name} x {item.quantity}</div>
                ))}
              </td>
              <td className="border px-4 py-2">₹{order.total_price}</td>
              <td className="border px-4 py-2 capitalize">{order.status}</td>
              <td className="border px-4 py-2">{new Date(order.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <p className="text-center mt-4">No restaurant orders found.</p>
      )}
    </div>
  );
}

export default withRoleGuard(RestaurantOrders, ['admin']);

