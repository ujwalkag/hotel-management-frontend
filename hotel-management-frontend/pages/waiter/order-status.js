import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function OrderStatus() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/restaurant/orders/?active_only=true');
      
      if (response && response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : data?.results || [];
        
        // Filter orders created by this waiter (safe filtering)
        const myOrders = ordersArray.filter(order => 
          order?.created_by === user?.id || 
          order?.created_by_name === user?.get_full_name?.() ||
          order?.created_by_name === user?.email
        );
        
        setOrders(myOrders);
      } else {
        setOrders([]); // Safe fallback
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]); // Safe fallback
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WaiterLayout>
      <div className="space-y-6">
        {/* Header with HOME BUTTON */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Order Status</h1>
              <p className="text-gray-600 mt-1">Track your orders and updates</p>
            </div>
            <Link
              href="/waiter/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center animate-pulse"
            >
              🏠 HOME
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-500 mb-4">You haven't taken any orders yet.</p>
                <div className="space-x-3">
                  <Link
                    href="/waiter/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-bold rounded-md text-purple-700 bg-white hover:bg-purple-50"
                  >
                    🏠 HOME Dashboard
                  </Link>
                  <Link
                    href="/waiter/take-orders"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Take Orders
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{order.menu_item_name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                        <p className="text-sm text-gray-600">Table: {order.table_number}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </WaiterLayout>
  );
}

export default withRoleGuard(OrderStatus, ['waiter']);
