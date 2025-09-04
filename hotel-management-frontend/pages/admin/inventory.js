// pages/admin/inventory.js - COMPLETE WITH REPORTS
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';

function AdminInventory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
    fetchMonthlyReport();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      
      const [entriesRes, categoriesRes] = await Promise.all([
        fetch(`/api/inventory/entries/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${user?.access}` }
        }),
        fetch('/api/inventory/categories/?active_only=true', {
          headers: { Authorization: `Bearer ${user?.access}` }
        })
      ]);

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch(`/api/inventory/entries/monthly_report/?month=${filters.month}&year=${filters.year}`, {
        headers: { Authorization: `Bearer ${user?.access}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
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

  const years = [2024, 2025, 2026];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ߓ Stock Tracking / स्टॉक ट्रैकिंग</h1>
        <div className="flex space-x-3">
          <Link 
            href="/admin/inventory-add-entry" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Add Purchase / खरीदारी जोड़ें
          </Link>
          <Link 
            href="/admin/dashboard" 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            ← Back to Dashboard / डैशबोर्ड पर वापस
          </Link>
        </div>
      </div>

      {/* Monthly Report Summary */}
      {reportData && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Monthly Report - {months.find(m => m.value == filters.month)?.name} {filters.year}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ₹{parseFloat(reportData.total_spent || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Total Spent / कुल खर्च</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.total_entries || 0}
              </div>
              <div className="text-sm text-gray-600">Total Entries / कुल एंट्री</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reportData.categories_data?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Categories Used / उपयोग की गई श्रेणियाँ</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {reportData.top_suppliers?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Suppliers / आपूर्तिकर्ता</div>
            </div>
          </div>

          {/* Top Categories & Suppliers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Categories */}
            <div>
              <h3 className="font-semibold mb-2">Top Categories / शीर्ष श्रेणियाँ</h3>
              <div className="space-y-2">
                {reportData.categories_data?.slice(0, 5).map((cat, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{cat.category__name}</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">₹{parseFloat(cat.spent).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">{cat.count} items</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Suppliers */}
            <div>
              <h3 className="font-semibold mb-2">Top Suppliers / शीर्ष आपूर्तिकर्ता</h3>
              <div className="space-y-2">
                {reportData.top_suppliers?.slice(0, 5).map((supplier, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{supplier.supplier_name}</span>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">₹{parseFloat(supplier.spent).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">{supplier.count} items</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters / फिल्टर</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <select 
            value={filters.month} 
            onChange={(e) => setFilters({...filters, month: e.target.value})}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>
          
          <select 
            value={filters.year} 
            onChange={(e) => setFilters({...filters, year: e.target.value})}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select 
            value={filters.category} 
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories / सभी श्रेणियाँ</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search items/suppliers / खोजें..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Purchase Entries / खरीदारी एंट्रियां ({entries.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading... / लोड हो रहा है...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(entry.purchase_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{entry.item_name}</div>
                      {entry.notes && (
                        <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.category_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₹{parseFloat(entry.price_per_unit).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ₹{parseFloat(entry.total_cost).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.supplier_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {entries.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">ߓ</div>
                <p className="text-gray-500 mb-4">No entries found / कोई एंट्री नहीं मिली</p>
                <Link 
                  href="/admin/inventory-add-entry"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Entry / पहली एंट्री जोड़ें
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(AdminInventory, ['admin']);
