// pages/admin/inventory.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';

function AdminInventory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [entriesRes, categoriesRes, statsRes] = await Promise.all([
        fetch(`/api/inventory/entries/?month=${filters.month}&year=${filters.year}&category=${filters.category}`, {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        fetch('/api/inventory/categories/?active_only=true', {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        fetch('/api/inventory/entries/dashboard_stats/', {
          headers: { Authorization: `Bearer ${user?.access}` }
        })
      ]);

      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, name: 'January / जनवरी' },
    { value: 2, name: 'February / फरवरी' },
    { value: 3, name: 'March / मार्च' },
    { value: 4, name: 'April / अप्रैल' },
    { value: 5, name: 'May / मई' },
    { value: 6, name: 'June / जून' },
    { value: 7, name: 'July / जुलाई' },
    { value: 8, name: 'August / अगस्त' },
    { value: 9, name: 'September / सितंबर' },
    { value: 10, name: 'October / अक्टूबर' },
    { value: 11, name: 'November / नवंबर' },
    { value: 12, name: 'December / दिसंबर' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ߓ Inventory Management / इन्वेंट्री प्रबंधन</h1>
        <div className="flex space-x-3">
          <Link href="/admin/inventory-add-entry" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            ➕ Add Entry / एंट्री जोड़ें
          </Link>
          <Link href="/admin/inventory-categories" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            ߓ Categories / श्रेणियाँ
          </Link>
          <Link href="/admin/inventory-reports" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            ߓ Reports / रिपोर्ट
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Current Month Spent / इस महीने खर्च</h3>
          <p className="text-2xl font-bold text-blue-600">₹{parseFloat(stats.current_month_spent || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Categories / कुल श्रेणियाँ</h3>
          <p className="text-2xl font-bold text-green-600">{stats.total_categories || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Recent Entries / हाल की एंट्रियां</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.recent_entries?.length || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters / फिल्टर</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select 
            value={filters.month} 
            onChange={(e) => setFilters({...filters, month: e.target.value})}
            className="border rounded px-3 py-2"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>
          
          <select 
            value={filters.year} 
            onChange={(e) => setFilters({...filters, year: e.target.value})}
            className="border rounded px-3 py-2"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select 
            value={filters.category} 
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="border rounded px-3 py-2"
          >
            <option value="">All Categories / सभी श्रेणियाँ</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Inventory Entries / इन्वेंट्री एंट्रियां</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date / दिनांक</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item / आइटम</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category / श्रेणी</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity / मात्रा</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price / कीमत</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total / कुल</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier / आपूर्तिकर्ता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(entry.purchase_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.item_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.category_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{parseFloat(entry.price_per_unit).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{parseFloat(entry.total_cost).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.supplier_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {entries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No entries found / कोई एंट्री नहीं मिली</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(AdminInventory, ['admin']);


