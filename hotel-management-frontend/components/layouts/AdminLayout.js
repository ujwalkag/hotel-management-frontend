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
    router.push('/login');
  };

  // Navigation items matching your existing admin pages
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'ߓ',
      current: currentPath === '/admin/dashboard'
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
      name: 'Inventory',
      href: '/admin/inventory',
      icon: 'ߓ',
      current: currentPath.startsWith('/admin/inventory'),
      children: [
        {
          name: 'Items',
          href: '/admin/inventory',
          icon: 'ߓ',
          current: currentPath === '/admin/inventory'
        },
        {
          name: 'Categories',
          href: '/admin/inventory-categories', 
          icon: 'ߓ',
          current: currentPath === '/admin/inventory-categories'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link href={item.href}>
                  <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    item.current 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                    {item.children && (
                      <span className="ml-auto">
                        {item.current ? 'ߓ' : 'ߓ'}
                      </span>
                    )}
                  </div>
                </Link>
                
                {/* Inventory Submenu */}
                {item.children && item.current && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children.map((subItem) => (
                      <Link key={subItem.name} href={subItem.href}>
                        <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          subItem.current
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}>
                          <span className="mr-2 text-sm">{subItem.icon}</span>
                          {subItem.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 ml-2"
              title="Logout"
            >
              ߚ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - EXACTLY like your dashboard expects */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
