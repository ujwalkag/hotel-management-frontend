// pages/admin/orders.js
import { useEffect, useState } from 'react';
import withRoleGuard from "@/hoc/withRoleGuard";
import axios from '@/utils/axiosInstance';
import { format } from 'date-fns';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [typeFilter, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/admin/all-orders/');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];
    if (typeFilter) {
      filtered = filtered.filter(order => order.type === typeFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    setFilteredOrders(filtered);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Orders</h2>

      <div className="flex gap-4 mb-4">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Types</option>
          <option value="room">Room</option>
          <option value="restaurant">Restaurant</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Type</th>
              <th className="border px-4 py-2">Customer</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => (
              <tr key={idx} className="text-center">
                <td className="border px-4 py-2 capitalize">{order.type}</td>
                <td className="border px-4 py-2">{order.guest}</td>
                <td className="border px-4 py-2">₹{order.amount}</td>
                <td className="border px-4 py-2 capitalize">{order.status}</td>
                <td className="border px-4 py-2">{format(new Date(order.date), 'dd-MM-yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <p className="text-center py-4">No orders found for selected filters.</p>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(OrdersPage, ['admin']);

