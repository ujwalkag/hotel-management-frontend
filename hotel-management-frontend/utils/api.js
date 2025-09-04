import axios from './axiosInstance';

export const fetchOrderSummary = () => axios.get('/api/admin/dashboard/summary/');
export const fetchSalesOverview = () => axios.get('/api/admin/dashboard/revenue/');
export const fetchBestSellingItems = () => axios.get('/api/admin/dashboard/best-selling/');

