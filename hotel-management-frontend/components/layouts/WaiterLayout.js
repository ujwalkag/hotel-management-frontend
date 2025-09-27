import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function WaiterLayout({ children }) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setCurrentPath(router.pathname);
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [router.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    router.push('/login');
  };

  const navigation = [
    {
      name: '🏠 HOME',
      href: '/waiter/dashboard',
      icon: '🏠',
      current: currentPath === '/waiter/dashboard',
      isHome: true
    },
    {
      name: 'My Tables',
      href: '/waiter/my-tables',
      icon: '🪑',
      current: currentPath === '/waiter/my-tables'
    },
    {
      name: 'Take Orders',
      href: '/waiter/take-orders',
      icon: '📝',
      current: currentPath === '/waiter/take-orders'
    },
    {
      name: 'Order Status',
      href: '/waiter/order-status',
      icon: '📋',
      current: currentPath === '/waiter/order-status'
    },
    {
      name: 'Kitchen Updates',
      href: '/waiter/kitchen-updates',
      icon: '🍳',
      current: currentPath === '/waiter/kitchen-updates'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col h-0 flex-1 bg-white shadow-lg">
          
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-purple-600 text-white">
            <div className="flex items-center">
              <span className="text-2xl mr-2">👨‍🍳</span>
              <h1 className="text-xl font-bold">Waiter Panel</h1>
            </div>
          </div>
          
          <nav className="mt-5 flex-1 px-2 bg-white space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? 'bg-purple-100 text-purple-900 border-r-4 border-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${
                  item.isHome 
                    ? 'ring-2 ring-purple-300 font-bold bg-purple-50 animate-pulse' 
                    : ''
                } group flex items-center px-2 py-3 text-sm font-medium rounded-l-md transition-all duration-150 hover:scale-105`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
                {item.isHome && (
                  <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    HOME
                  </span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* User Info */}
          <div className="flex-shrink-0 flex bg-gradient-to-r from-purple-50 to-blue-50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.email?.charAt(0).toUpperCase() || 'W'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-700">
                  {user?.first_name || user?.email?.split('@') || 'Waiter'}
                </p>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">
                  Waiter
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-all"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header - ALWAYS VISIBLE HOME BUTTON */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-purple-600 text-white p-4 flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center">
          <span className="text-xl mr-2">👨‍🍳</span>
          <h1 className="text-lg font-bold">Waiter Panel</h1>
        </div>
        <Link 
          href="/waiter/dashboard"
          className="bg-purple-500 hover:bg-purple-400 px-4 py-2 rounded-lg flex items-center text-sm font-bold shadow-md animate-pulse"
        >
          🏠 HOME
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:mt-0 mt-16">
        {/* UNIVERSAL TOP BAR WITH HOME BUTTON - APPEARS ON EVERY PAGE */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link 
              href="/waiter/dashboard" 
              className="hover:text-purple-600 flex items-center transition-colors bg-purple-50 px-3 py-1 rounded-full font-medium"
            >
              🏠 HOME
            </Link>
            <span>•</span>
            <span className="text-gray-900 font-medium capitalize">
              {currentPath.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </span>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Link 
              href="/waiter/take-orders"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md transition-all"
            >
              📝 Take Order
            </Link>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

