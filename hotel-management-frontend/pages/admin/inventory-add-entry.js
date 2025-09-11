// pages/admin/inventory-add-entry.js - ENHANCED WITH BETTER CATEGORY CREATION
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import { useRouter } from 'next/router';

function AddInventoryEntry() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category: '',
    item_name: '',
    price_per_unit: '',
    quantity: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    notes: ''
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories/?active_only=true', {
        headers: { Authorization: `Bearer ${user?.access}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Please enter category name / कृपया श्रेणी नाम दर्ज करें');
      return;
    }
    
    try {
      const res = await fetch('/api/inventory/categories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim()
        })
      });
      
      if (res.ok) {
        const category = await res.json();
        setCategories([...categories, category]);
        setForm({ ...form, category: category.id });
        setNewCategory({ name: '', description: '' });
        setShowAddCategory(false);
        alert(`Category "${category.name}" added successfully! / श्रेणी "${category.name}" सफलतापूर्वक जोड़ी गई!`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.name?.[0] || 'Failed to add category'}`);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Network error / नेटवर्क त्रुटि');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.category) {
      alert('Please select a category / कृपया श्रेणी चुनें');
      return;
    }
    if (!form.item_name.trim()) {
      alert('Please enter item name / कृपया आइटम नाम दर्ज करें');
      return;
    }
    if (!form.supplier_name.trim()) {
      alert('Please enter supplier name / कृपया आपूर्तिकर्ता नाम दर्ज करें');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/inventory/entries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access}`
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert('Purchase entry added successfully! / खरीदारी एंट्री सफलतापूर्वक जोड़ी गई!');
        router.push('/admin/inventory');
      } else {
        const error = await res.json();
        console.error('Server error:', error);
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Network error / नेटवर्क त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = (parseFloat(form.price_per_unit || 0) * parseFloat(form.quantity || 0)).toFixed(2);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">➕ Add Stock Purchase / स्टॉक खरीदारी जोड़ें</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back / वापस
        </button>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4">Add New Category / नई श्रेणी जोड़ें</h3>
            
            <input
              type="text"
              placeholder="Category Name / श्रेणी नाम"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            
            <textarea
              placeholder="Description (optional) / विवरण (वैकल्पिक)"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddCategory}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add / जोड़ें
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ name: '', description: '' });
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel / रद्द करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Selection with Add Button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category / श्रेणी *
              </label>
              <div className="flex">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="flex-1 px-3 py-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category / श्रेणी चुनें</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="bg-green-600 text-white px-3 py-2 rounded-r hover:bg-green-700"
                  title="Add new category / नई श्रेणी जोड़ें"
                >
                  ➕
                </button>
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name / आइटम नाम *
              </label>
              <input
                type="text"
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter item name / आइटम नाम दर्ज करें"
              />
            </div>

            {/* Price per Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit / प्रति यूनिट कीमत *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price_per_unit"
                value={form.price_per_unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity / मात्रा *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date / खरीद दिनांक *
              </label>
              <input
                type="date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name / आपूर्तिकर्ता नाम *
              </label>
              <input
                type="text"
                name="supplier_name"
                value={form.supplier_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter supplier name / आपूर्तिकर्ता नाम दर्ज करें"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / टिप्पणी (Optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes / अतिरिक्त टिप्पणी"
            />
          </div>

          {/* Total Cost Display */}
          {form.price_per_unit && form.quantity && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">
                  Total Cost / कुल लागत:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{parseFloat(totalCost).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Cancel / रद्द करें
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding... / जोड़ रहे हैं...' : 'Add Purchase / खरीदारी जोड़ें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withRoleGuard(AddInventoryEntry, ['admin']);

