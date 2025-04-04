import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://hotelrshammad.co.in/api/admin/";

export const fetchOrderSummary = async () => {
  const res = await axios.get(`${API_URL}order-summary/`);
  return res.data;
};

export const fetchSalesOverview = async () => {
  const res = await axios.get(`${API_URL}sales-overview/`);
  return res.data;
};

export const fetchBestSellingItems = async () => {
  const res = await axios.get(`${API_URL}best-selling-items/`);
  return res.data;
};

