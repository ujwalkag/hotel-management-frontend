import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function WaiterDashboard() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    myTables: [],
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tablesRes, statsRes] = await Promise.all([
        makeAuthenticatedRequest('/api/restaurant/tables/with_orders/'),
        makeAuthenticatedRequest('/api/restaurant/dashboard-stats/')
      ]);

      if (tablesRes && tablesRes.ok) {
        const tablesData = await tablesRes.json();
        // Filter tables that have orders created by this waiter or are currently occupied
        // Safe parsing with fallbacks
        const tablesArray = tablesData?.tables || tablesData || [];
        const myTables = Array.isArray(tablesArray) ? tablesArray.filter(table =>
          table?.status === 'occupied' ||
          (table?.active_orders && Array.isArray(table.active_orders) &&
            table.active_orders.some(order =>
              order?.created_by_name === user?.get_full_name?.() ||
              order?.created_by_name === user?.email
            ))
        ) : [];
        ;

        setDashboardData(prev => ({
          ...prev,
          myTables: myTables
        }));
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardData(prev => ({
          ...prev,
          todayOrders: statsData.orders?.total_today || 0,
          pendingOrders: statsData.orders?.pending || 0,
          completedOrders: statsData.orders?.ready || 0
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTableStatusIcon = (status) => {
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
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </WaiterLayout>
    );
  }

  return (
    <WaiterLayout>
      <div className="space-y-6">
        {/* Welcome Header with HOME BUTTON */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {user?.first_name || user?.email?.split('@') || 'Waiter'}! 👋
              </h1>
              <p className="text-purple-100 mt-1">
                Ready to serve guests with excellence
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/waiter/dashboard"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-all animate-pulse"
              >
                🏠 HOME
              </Link>
              <div className="text-6xl opacity-20">👨‍🍳</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-4">🪑</div>
              <div>
                <p className="text-sm font-medium text-gray-600">My Tables</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.myTables.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-4">📝</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.todayOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="text-2xl text-orange-600 mr-4">⏳</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-2xl text-purple-600 mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ready Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions with HOME ACCESS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/waiter/dashboard" className="group">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold mb-2">HOME Dashboard</h3>
                <p className="text-sm text-purple-100">Return to main dashboard</p>
              </div>
            </div>
          </Link>

          <Link href="/waiter/take-orders" className="group">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-purple-200 group-hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Take New Order</h3>
                <p className="text-sm text-gray-600">Start taking orders for your tables</p>
              </div>
            </div>
          </Link>

          <Link href="/waiter/my-tables" className="group">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200 group-hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-4">🪑</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">View My Tables</h3>
                <p className="text-sm text-gray-600">Check status of your assigned tables</p>
              </div>
            </div>
          </Link>

          <Link href="/waiter/order-status" className="group">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-green-200 group-hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Status</h3>
                <p className="text-sm text-gray-600">Track your orders and updates</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Tables Overview with HOME NAVIGATION */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Tables Overview</h2>
              <div className="flex items-center space-x-2">
                <Link
                  href="/waiter/dashboard"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium bg-purple-50 px-3 py-1 rounded-full"
                >
                  🏠 HOME
                </Link>
                <Link
                  href="/waiter/my-tables"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            {dashboardData.myTables.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🪑</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Assigned</h3>
                <p className="text-gray-500 mb-4">You don't have any tables currently assigned or occupied.</p>
                <div className="flex justify-center space-x-3">
                  <Link
                    href="/waiter/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
                  >
                    🏠 HOME
                  </Link>
                  <Link
                    href="/waiter/take-orders"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Start Taking Orders
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.myTables.slice(0, 6).map(table => (
                  <div key={table.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Table {table.table_number}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${table.status === 'occupied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {getTableStatusIcon(table.status)} {table.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span>{table.capacity} people</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Orders:</span>
                        <span>{table.active_orders_count || 0}</span>
                      </div>
                      {table.total_bill_amount > 0 && (
                        <div className="flex justify-between">
                          <span>Bill Amount:</span>
                          <span className="font-medium">₹{table.total_bill_amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Link
                        href={`/waiter/take-orders?table=${table.id}`}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs text-center"
                      >
                        Add Order
                      </Link>
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

export default withRoleGuard(WaiterDashboard, ['waiter']);


