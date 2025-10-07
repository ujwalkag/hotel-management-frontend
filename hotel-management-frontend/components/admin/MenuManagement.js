import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

function MenuManagement() {
    const { user } = useAuth();
    const { language } = useLanguage();
    
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(false);

    const [newItem, setNewItem] = useState({
        name_en: "",
        name_hi: "",
        description_en: "",
        description_hi: "",
        price: "",
        category_id: "",
        preparation_time: 15,
        is_veg: true,
        is_spicy: false,
        allergens: "",
        available: true
    });

    const [newCategory, setNewCategory] = useState({
        name_en: "",
        name_hi: "",
        description: ""
    });

    useEffect(() => {
        if (user?.access) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchCategories(), fetchMenuItems()]);
        } catch (error) {
            console.error('Error loading menu data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/restaurant/menu-categories/", {
                headers: { Authorization: `Bearer ${user.access}` },
            });
            
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                throw new Error('Failed to load categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error("Failed to load categories");
        }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await fetch("/api/restaurant/menu-items/", {
                headers: { Authorization: `Bearer ${user.access}` },
            });
            
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            } else {
                throw new Error('Failed to load menu items');
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            toast.error("Failed to load menu items");
        }
    };

    const handleCreateItem = async () => {
        if (!newItem.name_en || !newItem.price) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            const res = await fetch("/api/restaurant/menu-items/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.access}`,
                },
                  body: JSON.stringify({
    			name: newItem.name_en,
			category: newItem.category_id,
    			name_en: newItem.name_en,
    			name_hi: newItem.name_hi,
    			description_en: newItem.description_en,
    			description_hi: newItem.description_hi,
    			price: parseFloat(newItem.price),
    			//category: parseInt(newItem.category_id, 10),
    			preparation_time: newItem.preparation_time,
    			is_veg: newItem.is_veg,
    			is_spicy: newItem.is_spicy,
    			allergens: newItem.allergens,
    			available: newItem.available,
		  }),

            });

            if (res.ok) {
                toast.success("Menu item created successfully!");
                setNewItem({
                    name_en: "",
                    name_hi: "",
                    description_en: "",
                    description_hi: "",
                    price: "",
                    category_id: "",
                    preparation_time: 15,
                    is_veg: true,
                    is_spicy: false,
                    allergens: "",
                    available: true
                });
                setShowAddItem(false);
                fetchMenuItems();
            } else {
                const errorData = await res.json();
                toast.error(`Failed to create item: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating item:', error);
            toast.error("Error creating menu item");
        }
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;

        try {
            const res = await fetch(`/api/restaurant/menu-items/${editingItem.id}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.access}`,
                },
                 body: JSON.stringify({
			name: editingItem.name_en,      
			category: editingItem.category_id,  
        		name_en: editingItem.name_en,
        		name_hi: editingItem.name_hi,
        		description_en: editingItem.description_en,
        		description_hi: editingItem.description_hi,
        		price: parseFloat(editingItem.price),
        		//category: parseInt(editingItem.category_id || (editingItem.category?.id), 10),
        		preparation_time: editingItem.preparation_time,
        		is_veg: editingItem.is_veg,
        		is_spicy: editingItem.is_spicy,
        		allergens: editingItem.allergens,
        		available: editingItem.available,
      		}),
            });

            if (res.ok) {
                toast.success("Menu item updated successfully!");
                setEditingItem(null);
                fetchMenuItems();
            } else {
                const errorData = await res.json();
                toast.error(`Failed to update item: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating item:', error);
            toast.error("Error updating menu item");
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch(`/api/restaurant/menu-items/${itemId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${user.access}` },
            });

            if (res.ok) {
                toast.success("Menu item deleted successfully!");
                fetchMenuItems();
            } else {
                toast.error("Failed to delete menu item");
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error("Error deleting menu item");
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name_en) {
            toast.error("Please enter category name");
            return;
        }

        try {
            const res = await fetch("/api/restaurant/menu-categories/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.access}`,
                },
                body: JSON.stringify({
  			name: newCategory.name_en.trim(),  // add this line
  			name_en: newCategory.name_en.trim(),
  			name_hi: newCategory.name_hi.trim(),
  			description: newCategory.description || ""
		}),
            });

            if (res.ok) {
                toast.success("Category created successfully!");
                setNewCategory({
                    name_en: "",
                    name_hi: "",
                    description: ""
                });
                setShowAddCategory(false);
                fetchCategories();
            } else {
                const errorData = await res.json();
                toast.error(`Failed to create category: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error("Error creating category");
        }
    };

    const filteredItems = selectedCategory 
        ? menuItems.filter(item => item.category?.id === parseInt(selectedCategory))
        : menuItems;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {language === "hi" ? "🍽️ मेनू प्रबंधन" : "🍽️ Menu Management"}
                        </h1>
                        <p className="text-green-100">
                            {language === "hi" 
                                ? "रेस्टोरेंट मेनू आइटम और श्रेणियों का प्रबंधन करें"
                                : "Manage restaurant menu items and categories"
                            }
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{menuItems.length}</div>
                        <div className="text-sm text-green-200">
                            {language === "hi" ? "कुल आइटम" : "Total Items"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => setShowAddCategory(true)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                    {language === "hi" ? "➕ नई श्रेणी जोड़ें" : "➕ Add New Category"}
                </button>
                <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                    {language === "hi" ? "➕ नया आइटम जोड़ें" : "➕ Add New Item"}
                </button>
                <button
                    onClick={loadData}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                    {loading ? "🔄" : "🔄"} {language === "hi" ? "रीलोड करें" : "Reload"}
                </button>
            </div>

            {/* Category Filter */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center space-x-4">
                    <label className="font-medium text-gray-700">
                        {language === "hi" ? "श्रेणी के अनुसार फ़िल्टर करें:" : "Filter by Category:"}
                    </label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">{language === "hi" ? "सभी श्रेणियाँ" : "All Categories"}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {language === "hi" ? (cat.name_hi || cat.name_en || cat.name) : (cat.name_en || cat.name)}
                            </option>
                        ))}
                    </select>
                    <div className="text-sm text-gray-500">
                        {filteredItems.length} {language === "hi" ? "आइटम" : "items"}
                    </div>
                </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {language === "hi" ? "आइटम" : "Item"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {language === "hi" ? "श्रेणी" : "Category"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {language === "hi" ? "कीमत" : "Price"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {language === "hi" ? "स्थिति" : "Status"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {language === "hi" ? "कार्य" : "Actions"}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {language === "hi" ? (item.name_hi || item.name_en || item.name) : (item.name_en || item.name)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {language === "hi" ? (item.description_hi || item.description_en || item.description) : (item.description_en || item.description)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.category ? (language === "hi" ? (item.category.name_hi || item.category.name_en || item.category.name) : (item.category.name_en || item.category.name)) : 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{item.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.available ? 
                                                (language === "hi" ? "उपलब्ध" : "Available") : 
                                                (language === "hi" ? "अनुपलब्ध" : "Unavailable")
                                            }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                {language === "hi" ? "संपादित करें" : "Edit"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                {language === "hi" ? "हटाएं" : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">
                                {language === "hi" ? "नई श्रेणी जोड़ें" : "Add New Category"}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (अंग्रेजी)" : "Name (English)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name_en}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, name_en: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Category name in English"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (हिंदी)" : "Name (Hindi)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name_hi}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, name_hi: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="श्रेणी का नाम हिंदी में"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "विवरण" : "Description"}
                                    </label>
                                    <textarea
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder={language === "hi" ? "श्रेणी का विवरण..." : "Category description..."}
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => setShowAddCategory(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                                >
                                    {language === "hi" ? "रद्द करें" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleCreateCategory}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                                >
                                    {language === "hi" ? "श्रेणी जोड़ें" : "Add Category"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">
                                {language === "hi" ? "नया आइटम जोड़ें" : "Add New Menu Item"}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (अंग्रेजी) *" : "Name (English) *"}
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.name_en}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, name_en: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (हिंदी)" : "Name (Hindi)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.name_hi}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, name_hi: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "विवरण (अंग्रेजी)" : "Description (English)"}
                                    </label>
                                    <textarea
                                        value={newItem.description_en}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, description_en: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "विवरण (हिंदी)" : "Description (Hindi)"}
                                    </label>
                                    <textarea
                                        value={newItem.description_hi}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, description_hi: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "कीमत (₹) *" : "Price (₹) *"}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "श्रेणी" : "Category"}
                                    </label>
                                    <select
                                        value={newItem.category_id}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, category_id: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{language === "hi" ? "श्रेणी चुनें" : "Select Category"}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {language === "hi" ? (cat.name_hi || cat.name_en || cat.name) : (cat.name_en || cat.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "तैयारी का समय (मिनट)" : "Preparation Time (minutes)"}
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.preparation_time}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 15 }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "एलर्जी" : "Allergens"}
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.allergens}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, allergens: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder={language === "hi" ? "कॉमा से अलग करें" : "Comma separated"}
                                    />
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newItem.is_veg}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, is_veg: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        {language === "hi" ? "शाकाहारी" : "Vegetarian"}
                                    </label>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newItem.is_spicy}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, is_spicy: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        {language === "hi" ? "तीखा" : "Spicy"}
                                    </label>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newItem.available}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, available: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        {language === "hi" ? "उपलब्ध" : "Available"}
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => setShowAddItem(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                                >
                                    {language === "hi" ? "रद्द करें" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleCreateItem}
                                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                                >
                                    {language === "hi" ? "आइटम जोड़ें" : "Add Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">
                                {language === "hi" ? "आइटम संपादित करें" : "Edit Menu Item"}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (अंग्रेजी) *" : "Name (English) *"}
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem.name_en}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, name_en: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "नाम (हिंदी)" : "Name (Hindi)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem.name_hi || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, name_hi: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "कीमत (₹) *" : "Price (₹) *"}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editingItem.price}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === "hi" ? "श्रेणी" : "Category"}
                                    </label>
                                    <select
                                        value={editingItem.category?.id || ''}
                                        onChange={(e) => {
                                            const categoryId = e.target.value;
                                            const category = categories.find(cat => cat.id === parseInt(categoryId));
                                            setEditingItem(prev => ({ ...prev, category_id: categoryId, category }));
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{language === "hi" ? "श्रेणी चुनें" : "Select Category"}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {language === "hi" ? (cat.name_hi || cat.name_en || cat.name) : (cat.name_en || cat.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="md:col-span-2 flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={editingItem.available}
                                            onChange={(e) => setEditingItem(prev => ({ ...prev, available: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        {language === "hi" ? "उपलब्ध" : "Available"}
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                                >
                                    {language === "hi" ? "रद्द करें" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleUpdateItem}
                                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                                >
                                    {language === "hi" ? "अपडेट करें" : "Update Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MenuManagement;
