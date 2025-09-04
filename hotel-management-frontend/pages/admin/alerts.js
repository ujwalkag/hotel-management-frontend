// pages/inventory/alerts.js - Low Stock Alerts page
import { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

import { inventoryApi } from '../../utils/inventoryApi';
import DashboardLayout from '../../components/DashboardLayout';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsRes, itemsRes, categoriesRes, suppliersRes] = await Promise.all([
        inventoryApi.getAlerts(),
        inventoryApi.getItems(),
        inventoryApi.getCategories(),
        inventoryApi.getSuppliers()
      ]);
      
      setAlerts(alertsRes.data.results || alertsRes.data);
      setItems(itemsRes.data.results || itemsRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setSuppliers(suppliersRes.data.results || suppliersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load alerts data');
    } finally {
      setLoading(false);
    }
  };

  // Generate alerts from items data (if backend doesn't have dedicated alerts)
  const generateAlertsFromItems = () => {
    return items.filter(item => {
      if (filterType === 'out-of-stock') {
        return item.current_stock === 0;
      } else if (filterType === 'low-stock') {
        return item.current_stock <= item.min_stock_level && item.current_stock > 0;
      } else {
        return item.current_stock <= item.min_stock_level;
      }
    }).map(item => ({
      id: item.id,
      item: item.id,
      item_name: item.name,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      alert_type: item.current_stock === 0 ? 'out_of_stock' : 'low_stock',
      created_at: new Date().toISOString(),
      is_resolved: false,
      category: item.category,
      supplier: item.supplier,
      sku: item.sku,
      unit: item.unit,
      unit_price: item.unit_price
    }));
  };

  const alertsToShow = alerts.length > 0 ? alerts : generateAlertsFromItems();

  const filteredAlerts = alertsToShow.filter(alert => {
    if (searchTerm && !alert.item_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.sku?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filterType === 'low-stock' && alert.alert_type !== 'low_stock') {
      return false;
    }
    if (filterType === 'out-of-stock' && alert.alert_type !== 'out_of_stock') {
      return false;
    }
    
    return true;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : 'N/A';
  };

  const handleMarkResolved = async (alertId) => {
    try {
      if (alerts.length > 0) {
        await inventoryApi.markAlertResolved(alertId);
        toast.success('Alert marked as resolved');
        await loadData();
      } else {
        toast.info('This is a system-generated alert. Update the item stock to resolve it.');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const handleCreatePurchaseOrder = (item) => {
    const orderData = {
      items: [{
        item: item.item || item.id,
        quantity: Math.max(item.min_stock_level - item.current_stock, item.min_stock_level),
        unit_price: item.unit_price || 0
      }],
      supplier: item.supplier
    };
    
    localStorage.setItem('draft_purchase_order', JSON.stringify(orderData));
    toast.success('Purchase order draft created. Redirecting...');
    
    setTimeout(() => {
      window.location.href = '/inventory/purchase-orders';
    }, 1000);
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'low_stock':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (alertType) => {
    return alertType === 'out_of_stock' ? 
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> :
      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const stats = {
    total: alertsToShow.length,
    lowStock: alertsToShow.filter(alert => alert.alert_type === 'low_stock').length,
    outOfStock: alertsToShow.filter(alert => alert.alert_type === 'out_of_stock').length,
    resolved: alertsToShow.filter(alert => alert.is_resolved).length
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Stock Alerts - Inventory Management</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor low stock and out-of-stock items</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts by item name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="low-stock">Low Stock Only</option>
              <option value="out-of-stock">Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-6 ${getAlertColor(alert.alert_type)} ${
                  alert.is_resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {alert.item_name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          SKU: {alert.sku}
                        </span>
                        {alert.is_resolved && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Resolved
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Current Stock:</span>
                          <span className={`ml-2 ${alert.current_stock === 0 ? 'text-red-600 font-bold' : ''}`}>
                            {alert.current_stock} {alert.unit}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Min Level:</span>
                          <span className="ml-2">{alert.min_stock_level} {alert.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium">Category:</span>
                          <span className="ml-2">{getCategoryName(alert.category)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Supplier:</span>
                          <span className="ml-2">{getSupplierName(alert.supplier)}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Alert Type:</span>
                        <span className="ml-2 capitalize">
                          {alert.alert_type?.replace('_', ' ') || 
                           (alert.current_stock === 0 ? 'Out of Stock' : 'Low Stock')}
                        </span>
                        {alert.created_at && (
                          <>
                            <span className="ml-4 font-medium">Created:</span>
                            <span className="ml-2">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleCreatePurchaseOrder(alert)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ShoppingCartIcon className="h-4 w-4 mr-1" />
                      Order Stock
                    </button>
                    
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleMarkResolved(alert.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'All items are properly stocked!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;
