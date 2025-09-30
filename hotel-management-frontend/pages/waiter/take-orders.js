import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function TakeOrders() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const router = useRouter();
  const { table: preselectedTable } = router.query;

  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(preselectedTable || '');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (preselectedTable) {
      setSelectedTable(preselectedTable);
    }
  }, [preselectedTable]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // ✅ FIXED: Get all tables first, then filter in frontend
      const [tablesRes, menuRes, categoriesRes] = await Promise.all([
        makeAuthenticatedRequest('/api/restaurant/tables/'), // REMOVED: ?status=free,occupied
        makeAuthenticatedRequest('/api/restaurant/menu-for-ordering/'),
        makeAuthenticatedRequest('/api/restaurant/menu-categories/')
      ]);

      if (tablesRes && tablesRes.ok) {
        const tablesData = await tablesRes.json();
        const allTables = Array.isArray(tablesData) ? tablesData : tablesData.tables || [];

        // ✅ FIXED: Filter for available tables (free and occupied) in frontend
        const availableTables = allTables.filter(table =>
          ['free', 'occupied'].includes(table.status) && table.is_active !== false
        );

        console.log('🔍 Debug - Total tables from API:', allTables.length);
        console.log('🔍 Debug - Available tables after filter:', availableTables.length);

        setTables(availableTables);
      }

      if (menuRes && menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }

      if (categoriesRes && categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => prev.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1, special_instructions: '' }]);
    }
    toast.success(`Added ${item.name} to order`);
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setSelectedItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const updateItemInstructions = (itemId, instructions) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, special_instructions: instructions } : item
    ));
  };

  const removeItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const submitOrder = async () => {
    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please select items to order');
      return;
    }

    try {
      setLoading(true);
      const orders = selectedItems.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        special_instructions: item.special_instructions || ''
      }));

      const response = await makeAuthenticatedRequest('/api/restaurant/orders/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({
          table: selectedTable,
          orders: orders
        })
      });

      if (response && response.ok) {
        const result = await response.json();
        toast.success(`✅ Order placed successfully! ${selectedItems.length} items ordered.`);

        // Reset form
        setSelectedItems([]);
        setSearchQuery('');
        setSelectedCategory('');

        // Show success message with order details
        const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTimeout(() => {
          toast.success(`Order Total: ₹${totalAmount.toFixed(2)}`, {
            icon: '💰',
            duration: 4000
          });
        }, 1000);

        // Show options to user
        setTimeout(() => {
          if (confirm('Order placed successfully! Go to Order Status or return to HOME?')) {
            router.push('/waiter/order-status');
          } else {
            router.push('/waiter/dashboard'); // HOME
          }
        }, 2000);

      } else {
        const error = await response.json();
        toast.error(`Failed to place order: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Network error while placing order');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(category => {
    if (selectedCategory && category.id.toString() !== selectedCategory) return false;

    if (searchQuery) {
      return category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.items?.some(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    return true;
  }).map(category => ({
    ...category,
    items: category.items?.filter(item =>
      !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
  })).filter(category => category.items.length > 0);

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <WaiterLayout>
      <div className="space-y-6">
        {/* Header with HOME BUTTON */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">📝 Take New Order</h1>

            {/* PROMINENT HOME BUTTON */}
            <div className="flex items-center space-x-2">
              <Link
                href="/waiter/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center animate-pulse"
              >
                🏠 HOME
              </Link>
            </div>
          </div>

          {/* Table Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Table *</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Choose a table...</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} - {table.capacity} seats ({table.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Summary Card with HOME ACCESS */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-purple-900">Order Summary</h3>
                <Link href="/waiter/dashboard" className="text-xs text-purple-600 hover:text-purple-800">🏠 HOME</Link>
              </div>
              <div className="text-sm text-purple-700">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{selectedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter with HOME BUTTON */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Browse Menu</h2>
            <Link
              href="/waiter/dashboard"
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              🏠 HOME
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items with HOME ACCESS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items List */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading menu items...</p>
                <Link href="/waiter/dashboard" className="mt-2 inline-block text-purple-600 hover:text-purple-800">🏠 Return HOME</Link>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or category filter.</p>
                <Link
                  href="/waiter/dashboard"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  🏠 Return HOME
                </Link>
              </div>
            ) : (
              filteredMenuItems.map(category => (
                <div key={category.id} className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                      <Link href="/waiter/dashboard" className="text-xs text-purple-600 hover:text-purple-800">🏠 HOME</Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(category.items || []).map(item => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => addItemToOrder(item)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <div className="text-right">
                              <span className="font-bold text-green-600">₹{item.price}</span>
                              {item.is_veg && (
                                <div className="inline-block ml-2 w-3 h-3 border-2 border-green-500 rounded-sm">
                                  <div className="w-full h-full bg-green-500 rounded-sm"></div>
                                </div>
                              )}
                              {!item.is_veg && (
                                <div className="inline-block ml-2 w-3 h-3 border-2 border-red-500 rounded-sm">
                                  <div className="w-full h-full bg-red-500 rounded-sm"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              🕒 {item.preparation_time || 15} mins
                            </span>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                              + Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Items Panel with HOME ACCESS */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Selected Items ({selectedItems.length})</h2>
                  <Link href="/waiter/dashboard" className="text-xs text-purple-600 hover:text-purple-800">🏠 HOME</Link>
                </div>
              </div>

              <div className="p-6">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🛒</div>
                    <p className="text-gray-500 mb-4">No items selected</p>
                    <Link
                      href="/waiter/dashboard"
                      className="inline-block bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded text-sm"
                    >
                      🏠 Return HOME
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItems.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm min-w-[40px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-medium text-green-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        <textarea
                          value={item.special_instructions || ''}
                          onChange={(e) => updateItemInstructions(item.id, e.target.value)}
                          placeholder="Special instructions..."
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                          rows="2"
                        />
                      </div>
                    ))}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold text-lg text-green-600">₹{totalAmount.toFixed(2)}</span>
                      </div>

                      {/* HOME BUTTON in Order Panel */}
                      <div className="space-y-2">
                        <Link
                          href="/waiter/dashboard"
                          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-4 rounded-lg font-medium text-center block"
                        >
                          🏠 Return HOME
                        </Link>

                        <button
                          onClick={submitOrder}
                          disabled={!selectedTable || selectedItems.length === 0 || loading}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Placing Order...
                            </span>
                          ) : (
                            `Place Order (${selectedItems.length} items)`
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WaiterLayout>
  );
}

export default withRoleGuard(TakeOrders, ['waiter']);


