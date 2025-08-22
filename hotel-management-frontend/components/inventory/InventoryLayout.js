// components/inventory/InventoryLayout.js - Navigation layout for inventory pages
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  CubeIcon,
  TagIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const InventoryLayout = ({ children, title }) => {
  const router = useRouter();

  const navigationItems = [
    {
      name: 'Items',
      href: '/inventory',
      icon: CubeIcon,
      description: 'Manage inventory items and stock levels'
    },
    {
      name: 'Categories',
      href: '/inventory/categories',
      icon: TagIcon,
      description: 'Organize items by categories'
    },
    {
      name: 'Suppliers',
      href: '/inventory/suppliers',
      icon: TruckIcon,
      description: 'Manage supplier information'
    },
    {
      name: 'Stock Alerts',
      href: '/inventory/alerts',
      icon: ExclamationTriangleIcon,
      description: 'Monitor low stock and out-of-stock items'
    },
    {
      name: 'Purchase Orders',
      href: '/inventory/purchase-orders',
      icon: DocumentTextIcon,
      description: 'Create and manage purchase orders'
    },
    {
      name: 'Stock Movements',
      href: '/inventory/movements',
      icon: ChartBarIcon,
      description: 'Track stock in/out movements'
    }
  ];

  const isActivePath = (path) => {
    if (path === '/inventory') {
      return router.pathname === '/inventory' || router.pathname === '/inventory/index';
    }
    return router.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <a className="text-gray-500 hover:text-gray-700">
                  ← Back to Dashboard
                </a>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-xl font-semibold text-gray-900">
                Inventory Management
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={item.description}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default InventoryLayout;
