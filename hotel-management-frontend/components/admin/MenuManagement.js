import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

function MenuManagement() {
    const { user } = useAuth();
    const { language } = useLanguage();
    
    // State management
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]); // ✅ ADDED: Separate filtered state
    const [loading, setLoading] = useState(false);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all, available, unavailable
    
    // Load initial data
    useEffect(() => {
        if (user?.access) {
            loadInitialData();
        }
    }, [user]);
    
    // ✅ FIXED: Apply filters whenever items or filter criteria change
    useEffect(() => {
        applyFilters();
    }, [items, searchQuery, selectedCategory, availabilityFilter]);
    
    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchItems(), fetchCategories()]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchItems = async () => {
        try {
            const res = await fetch('/api/restaurant/menu-for-ordering/', {
                headers: { Authorization: `Bearer ${user.access}` },
            });
            
            if (res.ok) {
                const data = await res.json();
                const allItems = [];
                
                // ✅ FIXED: Handle nested category structure properly
                data.forEach(categoryData => {
                    if (categoryData.items && Array.isArray(categoryData.items)) {
                        categoryData.items.forEach(item => {
                            allItems.push({
                                ...item,
                                category_id: categoryData.category?.id || categoryData.id,
                                category_name: categoryData.category?.name || categoryData.name,
                                // ✅ ENSURE: Consistent field naming
                                name_en: item.name_en || item.name,
                                name_hi: item.name_hi || item.name,
                                available: item.available !== false && item.is_active !== false
                            });
                        });
                    }
                });
                
                setItems(allItems);
            } else {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            toast.error(language === 'hi' ? 'आइटम लोड करने में विफल' : 'Failed to load items');
        }
    };
    
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/restaurant/menu-categories/', {
                headers: { Authorization: `Bearer ${user.access}` },
            });
            
            if (res.ok) {
                const data = await res.json();
                const categories = Array.isArray(data) ? data : data.results || [];
                setCategories(categories);
            } else {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error(language === 'hi' ? 'श्रेणियाँ लोड करने में विफल' : 'Failed to load categories');
        }
    };
    
    // ✅ FIXED: Comprehensive filtering logic
    const applyFilters = () => {
        let filtered = [...items];
        
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(item => {
                const searchableFields = [
                    item.name,
                    item.name_en,
                    item.name_hi,
                    item.description,
                    item.category_name
                ].filter(Boolean); // Remove null/undefined
                
                return searchableFields.some(field => 
                    field.toLowerCase().includes(query)
                );
            });
        }
        
        // Apply category filter
        if (selectedCategory && selectedCategory !== '') {
            filtered = filtered.filter(item => {
                // ✅ FIXED: Handle both ID and name matching
                const categoryId = parseInt(selectedCategory);
                return item.category_id === categoryId || 
                       item.category_name === selectedCategory ||
                       item.category_id === selectedCategory;
            });
        }
        
        // Apply availability filter
        if (availabilityFilter !== 'all') {
            filtered = filtered.filter(item => {
                if (availabilityFilter === 'available') {
                    return item.available === true;
                } else if (availabilityFilter === 'unavailable') {
                    return item.available === false;
                }
                return true;
            });
        }
        
        setFilteredItems(filtered);
    };
    
    // ✅ FIXED: Clear all filters function
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setAvailabilityFilter('all');
    };
    
    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Menu Management...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {language === 'hi' ? '🍽️ मेनू प्रबंधन' : '🍽️ Menu Management'}
                        </h1>
                        <p className="text-green-100">
                            {language === 'hi' 
                                ? 'रेस्टोरेंट मेनू आइटम प्रबंधित करें'
                                : 'Manage restaurant menu items'
                            }
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{filteredItems.length}</div>
                        <div className="text-sm text-green-200">
                            {language === 'hi' ? 'कुल आइटम' : 'Total Items'}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">
                        {language === 'hi' ? '🔍 फिल्टर' : '🔍 Filters'}
                    </h3>
                    <button
                        onClick={clearFilters}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                        {language === 'hi' ? 'सभी फिल्टर साफ करें' : 'Clear All Filters'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'खोज' : 'Search'}
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={language === 'hi' ? 'आइटम खोजें...' : 'Search items...'}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'श्रेणी' : 'Category'}
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">
                                {language === 'hi' ? 'सभी श्रेणियाँ' : 'All Categories'}
                            </option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {language === 'hi' ? (cat.name_hi || cat.name) : (cat.name_en || cat.name)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Availability Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'उपलब्धता' : 'Availability'}
                        </label>
                        <select
                            value={availabilityFilter}
                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">{language === 'hi' ? 'सभी' : 'All'}</option>
                            <option value="available">{language === 'hi' ? 'उपलब्ध' : 'Available'}</option>
                            <option value="unavailable">{language === 'hi' ? 'अनुपलब्ध' : 'Unavailable'}</option>
                        </select>
                    </div>
                    
                    {/* Results Count */}
                    <div className="flex items-end">
                        <div className="text-sm text-gray-600">
                            {language === 'hi' 
                                ? `${filteredItems.length} में से ${items.length} परिणाम दिखा रहे हैं`
                                : `Showing ${filteredItems.length} of ${items.length} results`
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Items Grid */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                    {language === 'hi' ? 'मेनू आइटम' : 'Menu Items'}
                </h3>
                
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium mb-2">
                            {language === 'hi' ? 'कोई आइटम नहीं मिला' : 'No items found'}
                        </h3>
                        <p className="text-sm">
                            {language === 'hi' 
                                ? 'अपने फिल्टर बदलने का प्रयास करें या खोज क्वेरी को साफ़ करें'
                                : 'Try changing your filters or clearing the search query'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map(item => {
                            const itemName = language === 'hi' 
                                ? (item.name_hi || item.name)
                                : (item.name_en || item.name);
                                
                            return (
                                <div
                                    key={item.id}
                                    className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                                        item.available 
                                            ? 'border-gray-200 hover:border-green-300' 
                                            : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-sm">{itemName}</h4>
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                item.available
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {item.available 
                                                ? (language === 'hi' ? 'उपलब्ध' : 'Available')
                                                : (language === 'hi' ? 'अनुपलब्ध' : 'Unavailable')
                                            }
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p className="font-bold text-green-600">₹{item.price}</p>
                                        {item.description && (
                                            <p className="text-xs">{item.description}</p>
                                        )}
                                        <p className="text-xs text-blue-600">
                                            {language === 'hi' ? 'श्रेणी: ' : 'Category: '}
                                            {item.category_name}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-3 flex space-x-2">
                                        <button className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600">
                                            {language === 'hi' ? 'संपादित करें' : 'Edit'}
                                        </button>
                                        <button className="flex-1 bg-gray-500 text-white text-xs py-2 px-3 rounded hover:bg-gray-600">
                                            {language === 'hi' ? 'देखें' : 'View'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MenuManagement;

