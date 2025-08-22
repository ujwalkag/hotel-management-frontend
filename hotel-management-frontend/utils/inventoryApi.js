// utils/inventoryApi.js - Inventory API functions using existing axiosInstance
import axiosInstance from './axiosInstance';

// Inventory API functions
export const inventoryApi = {
  // Categories
  getCategories: () => axiosInstance.get('/inventory/categories/'),
  createCategory: (data) => axiosInstance.post('/inventory/categories/', data),
  updateCategory: (id, data) => axiosInstance.put(`/inventory/categories/${id}/`, data),
  deleteCategory: (id) => axiosInstance.delete(`/inventory/categories/${id}/`),
  
  // Items
  getItems: (params = {}) => axiosInstance.get('/inventory/items/', { params }),
  getItem: (id) => axiosInstance.get(`/inventory/items/${id}/`),
  createItem: (data) => axiosInstance.post('/inventory/items/', data),
  updateItem: (id, data) => axiosInstance.put(`/inventory/items/${id}/`, data),
  deleteItem: (id) => axiosInstance.delete(`/inventory/items/${id}/`),
  
  // Stock Movements
  getMovements: (params = {}) => axiosInstance.get('/inventory/movements/', { params }),
  createMovement: (data) => axiosInstance.post('/inventory/movements/', data),
  
  // Low Stock Alerts
  getAlerts: () => axiosInstance.get('/inventory/alerts/'),
  markAlertResolved: (id) => axiosInstance.patch(`/inventory/alerts/${id}/`, { is_resolved: true }),
  
  // Suppliers
  getSuppliers: () => axiosInstance.get('/inventory/suppliers/'),
  createSupplier: (data) => axiosInstance.post('/inventory/suppliers/', data),
  updateSupplier: (id, data) => axiosInstance.put(`/inventory/suppliers/${id}/`, data),
  deleteSupplier: (id) => axiosInstance.delete(`/inventory/suppliers/${id}/`),
  
  // Purchase Orders
  getPurchaseOrders: (params = {}) => axiosInstance.get('/inventory/purchase-orders/', { params }),
  getPurchaseOrder: (id) => axiosInstance.get(`/inventory/purchase-orders/${id}/`),
  createPurchaseOrder: (data) => axiosInstance.post('/inventory/purchase-orders/', data),
  updatePurchaseOrder: (id, data) => axiosInstance.put(`/inventory/purchase-orders/${id}/`, data),
  markOrderReceived: (id) => axiosInstance.patch(`/inventory/purchase-orders/${id}/`, { status: 'received' }),
};

export default inventoryApi;
