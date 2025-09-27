import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function MyTables() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTables();
    // Refresh every 15 seconds
    const interval = setInterval(loadMyTables, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadMyTables = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/restaurant/tables/with_orders/');
      if (response && response.ok) {
        const data = await response.json();
        // Filter tables that have orders by this waiter or are currently occupied
        const myTables = data.tables.filter(table => 
          table.status === 'occupied' || 
          table.active_orders.some(order => 
            order.created_by_name === user?.get_full_name?.() || 
            order.created_by_name === user?.email
          )
        );
        setTables(myTables);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      free: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-red-100 text-red-800 border-red-200',
      reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cleaning: 'bg-blue-100 text-blue-800 border-blue-200',
      maintenance: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.free;
  };

  const getStatusIcon = (status) => {
    const icons = {
      free: '✅',
      occupied: '👥', 
      reserved: '📅',
      cleaning: '🧹',
      maintenance: '🔧'
    };
    return icons[status] || '❓';
  };

  if (loading) {
    return (
      <WaiterLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tables...</p>
            <Link href="/waiter/dashboard" className="mt-2 inline-block text-purple-600 hover:text-purple-800">🏠 Return HOME</Link>
          </div>
        </div>
      </WaiterLayout>
    );
  }

  return (
    <WaiterLayout>
      <div className="space-y-6">
        {/* Header with HOME BUTTON */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🪑 My Tables</h1>
              <p className="text-gray-600 mt-1">Monitor and manage your assigned tables</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/waiter/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center animate-pulse"
              >
                🏠 HOME
              </Link>
              <Link
                href="/waiter/take-orders"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                📝 Take New Order
              </Link>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🪑</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tables Assigned</h3>
              <p className="text-gray-600 mb-6">You don't have any tables currently assigned. Start taking orders to see your tables here.</p>
              <div className="flex justify-center space-x-3">
                <Link
                  href="/waiter/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-purple-300 text-base font-bold rounded-md text-purple-700 bg-white hover:bg-purple-50"
                >
                  🏠 HOME Dashboard
                </Link>
                <Link
                  href="/waiter/take-orders"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Start Taking Orders
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map(table => (
              <div key={table.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Table {table.table_number}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(table.status)}`}>
                        {getStatusIcon(table.status)} {table.status}
                      </span>
                      <Link href="/waiter/dashboard" className="text-xs text-purple-600 hover:text-purple-800">🏠</Link>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{table.capacity} people</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Orders:</span>
                      <span className="font-medium">{table.active_orders_count || 0}</span>
                    </div>
                    
                    {table.location && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">📍 {table.location}</span>
                      </div>
                    )}
                    
                    {table.total_bill_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bill Amount:</span>
                        <span className="font-bold text-green-600">₹{table.total_bill_amount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {table.time_occupied > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupied for:</span>
                        <span className="font-medium">{Math.floor(table.time_occupied / 60)}h {table.time_occupied % 60}m</span>
                      </div>
                    )}
                  </div>

                  {/* Active Orders Preview */}
                  {table.active_orders && table.active_orders.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Recent Orders:</h4>
                        <Link href="/waiter/dashboard" className="text-xs text-purple-600 hover:text-purple-800">🏠 HOME</Link>
                      </div>
                      <div className="space-y-1">
                        {table.active_orders.slice(0, 3).map((order, index) => (
                          <div key={index} className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded">
                            <span>{order.menu_item_name} x{order.quantity}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'ready' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                        {table.active_orders.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{table.active_orders.length - 3} more orders
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons with HOME ACCESS */}
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/waiter/dashboard"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-2 rounded text-xs text-center font-bold"
                    >
                      🏠 HOME
                    </Link>
                    <Link
                      href={`/waiter/take-orders?table=${table.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded text-xs text-center font-medium"
                    >
                      📝 Add Order
                    </Link>
                    <Link
                      href={`/waiter/order-status?table=${table.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded text-xs text-center font-medium"
                    >
                      📋 View Orders
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WaiterLayout>
  );
}

export default withRoleGuard(MyTables, ['waiter']);
