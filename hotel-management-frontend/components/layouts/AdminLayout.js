import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setCurrentPath(router.pathname);
    
    // Get user from localStorage (same as your existing logic)
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

  // Enhanced navigation items with Kitchen added
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'ߓ',
      current: currentPath === '/admin/dashboard'
    },
    {
      name: 'Kitchen / किचन',
      href: '/kitchen',
      icon: 'ߍ',
      current: currentPath === '/kitchen'
    },
    {
      name: 'Rooms',
      href: '/admin/manage-rooms',
      icon: 'ߏ',
      current: currentPath === '/admin/manage-rooms'
    },
    {
      name: 'Menu',
      href: '/admin/manage-menu',
      icon: 'ߍ️', 
      current: currentPath === '/admin/manage-menu'
    },
    {
      name: 'Staff / स्टाफ',
      href: '/admin/manage-staff',
      icon: 'ߑ',
      current: currentPath === '/admin/manage-staff'
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: 'ߓ',
      current: currentPath === '/admin/orders'
    },
    {
      name: 'Billing',
      href: '/admin/billing',
      icon: 'ߒ',
      current: currentPath === '/admin/billing'
    },
    {
      name: 'Categories',
      href: '/admin/inventory-categories', 
      icon: 'ߏ️',
      current: currentPath === '/admin/inventory-categories'
    },
    {
      name: 'Advance Bookings',
      href: '/admin/advance-bookings',
      icon: '📅',
      current: router.pathname.startsWith('/admin/advance-bookings')
   },

  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h1>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <a className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors
                  ${item.current 
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}>
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 p-2 rounded"
              title="Logout"
            >
              ߚ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

