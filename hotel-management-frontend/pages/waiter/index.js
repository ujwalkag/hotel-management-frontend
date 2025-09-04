import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';

function WaiterDashboard() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.access) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Use your existing production APIs
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('/api/tables/tables/', {
          headers: { Authorization: `Bearer ${user.access}` }
        }),
        fetch('/api/tables/orders/', { 
          headers: { Authorization: `Bearer ${user.access}` }
        })
      ]);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(Array.isArray(tablesData) ? tablesData : []);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json(); 
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">Loading...</p>
        </div>
      </div>
    );
  }

  const availableTables = tables.filter(t => !t.is_occupied);
  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <div>
            <h1 className="text-xl font-bold">ߍ️ Waiter Panel</h1>
            <p className="text-blue-100 text-sm">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-4 max-w-sm mx-auto pb-20">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <div className="text-3xl text-green-600 font-bold mb-1">
              {availableTables.length}
            </div>
            <div className="text-sm text-gray-600">Available Tables</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <div className="text-3xl text-orange-600 font-bold mb-1">
              {pendingOrders.length}
            </div>
            <div className="text-sm text-gray-600">Pending Orders</div>
          </div>
        </div>

        {/* Create Order Button */}
        <div className="mb-6">
          <Link 
            href="/waiter/create-order"
            className="block bg-green-600 text-white p-6 rounded-xl text-center shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="text-xl font-bold mb-1">Create New Order</div>
            <div className="text-green-100 text-sm">Select table and add items</div>
          </Link>
        </div>

        {/* Available Tables */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-md">
          <h3 className="font-bold mb-4 text-gray-800 text-lg">Available Tables</h3>
          
          {availableTables.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {availableTables.slice(0, 9).map(table => (
                <Link
                  key={table.id}
                  href={`/waiter/create-order?table=${table.id}`}
                  className="bg-green-50 border-2 border-green-200 p-4 rounded-lg text-center hover:bg-green-100 active:bg-green-200 transition-colors"
                >
                  <div className="text-lg font-bold text-green-800">
                    T{table.table_number}
                  </div>
                  <div className="text-xs text-green-600">
                    {table.capacity} seats
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">ߔ</div>
              <p className="text-gray-500">All tables occupied</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h3 className="font-bold mb-4 text-gray-800 text-lg">Recent Orders</h3>
          
          {orders.length > 0 ? (
            orders.slice(0, 5).map((order, index) => (
              <div key={order.id || index} className="border-b border-gray-100 pb-3 mb-3 last:border-b-0 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      Table {order.table_number || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      #{order.order_number || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{parseFloat(order.total_amount || 0).toFixed(0)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status || 'pending'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">ߓ</div>
              <p className="text-gray-500">No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-3 max-w-sm mx-auto">
          <Link href="/waiter" className="p-4 text-center text-blue-600">
            <div className="text-2xl mb-1">ߏ</div>
            <div className="text-xs font-medium">Home</div>
          </Link>
          <Link href="/waiter/create-order" className="p-4 text-center text-gray-600">
            <div className="text-2xl mb-1">➕</div>
            <div className="text-xs font-medium">New Order</div>
          </Link>
          <Link href="/staff/restaurant-billing" className="p-4 text-center text-gray-600">
            <div className="text-2xl mb-1">ߒ</div>
            <div className="text-xs font-medium">Billing</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Allow admin and staff access for testing
export default withRoleGuard(WaiterDashboard, ['admin', 'staff']);
