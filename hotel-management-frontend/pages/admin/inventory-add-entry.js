// pages/admin/inventory-add-entry.js - COMPLETE ENHANCED VERSION
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

function CompleteEnhancedAddInventoryEntry() {
    const { user } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        category: '',
        item_name: '',
        price_per_unit: '',
        quantity: '',
        unit_type: 'pieces',
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        notes: '',
        is_recurring: false,
        priority: 'medium',
        tags: ''
    });
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [commonTags, setCommonTags] = useState([]);
    const [categoryStats, setCategoryStats] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchCategories();
        fetchCommonData();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/inventory/categories/?active_only=true', {
                headers: { Authorization: `Bearer ${user?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : data.results || []);
            } else {
                toast.error('Failed to load categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error loading categories');
        } finally {
            setFormLoading(false);
        }
    };

    const fetchCommonData = async () => {
        try {
            const res = await fetch('/api/inventory/entries/filter_options/', {
                headers: { Authorization: `Bearer ${user?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data.suppliers?.slice(0, 50) || []); // Limit to 50 suppliers
                setCommonTags(data.tags?.slice(0, 30) || []); // Top 30 tags
            }
        } catch (error) {
            console.error('Error fetching common data:', error);
        }
    };

    const fetchCategoryStats = async (categoryId) => {
        try {
            const res = await fetch(`/api/inventory/categories/${categoryId}/spending_analysis/`, {
                headers: { Authorization: `Bearer ${user?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategoryStats(data);
            }
        } catch (error) {
            console.error('Error fetching category stats:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setForm({ 
            ...form, 
            [name]: newValue 
        });

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: ''
            });
        }

        // Fetch category stats when category changes
        if (name === 'category' && value) {
            fetchCategoryStats(value);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!form.category) {
            errors.category = 'Please select a category';
        }
        if (!form.item_name.trim()) {
            errors.item_name = 'Please enter item name';
        }
        if (!form.supplier_name.trim()) {
            errors.supplier_name = 'Please enter supplier name';
        }
        if (!form.price_per_unit || parseFloat(form.price_per_unit) <= 0) {
            errors.price_per_unit = 'Please enter valid price';
        }
        if (!form.quantity || parseFloat(form.quantity) <= 0) {
            errors.quantity = 'Please enter valid quantity';
        }
        if (!form.purchase_date) {
            errors.purchase_date = 'Please select purchase date';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error('Please enter category name / कृपया श्रेणी नाम दर्ज करें');
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
                toast.success(`Category "${category.name}" added successfully!`);
            } else {
                const error = await res.json();
                toast.error(`Error: ${error.name?.[0] || 'Failed to add category'}`);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Network error / नेटवर्क त्रुटि');
        }
    };

    const addTagToForm = (tag) => {
        const currentTags = form.tags ? form.tags.split(',').map(t => t.trim()) : [];
        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag].join(', ');
            setForm({ ...form, tags: newTags });
            toast.success(`Tag "${tag}" added`);
        } else {
            toast.info(`Tag "${tag}" already added`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please correct the errors and try again');
            return;
        }

        setLoading(true);

        try {
            const formData = {
                ...form,
                price_per_unit: parseFloat(form.price_per_unit),
                quantity: parseFloat(form.quantity),
                tags: form.tags.trim()
            };

            const res = await fetch('/api/inventory/entries/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.access}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const newEntry = await res.json();
                toast.success('Purchase entry added successfully! / खरीदारी एंट्री सफलतापूर्वक जोड़ी गई!');

                // Ask if user wants to add another entry
                if (window.confirm('Entry added successfully! Do you want to add another entry?')) {
                    // Reset form but keep category and supplier for convenience
                    setForm({
                        category: form.category,
                        item_name: '',
                        price_per_unit: '',
                        quantity: '',
                        unit_type: 'pieces',
                        purchase_date: new Date().toISOString().split('T')[0],
                        supplier_name: form.supplier_name,
                        notes: '',
                        is_recurring: false,
                        priority: 'medium',
                        tags: ''
                    });
                } else {
                    router.push('/admin/inventory');
                }
            } else {
                const error = await res.json();
                console.error('Server error:', error);

                // Handle validation errors
                if (error.errors || error.detail) {
                    const serverErrors = {};
                    if (error.errors) {
                        Object.keys(error.errors).forEach(key => {
                            serverErrors[key] = Array.isArray(error.errors[key]) 
                                ? error.errors[key][0] 
                                : error.errors[key];
                        });
                    }
                    setValidationErrors(serverErrors);
                    toast.error('Please check the form for errors');
                } else {
                    toast.error(`Error: ${error.message || 'Failed to add entry'}`);
                }
            }
        } catch (error) {
            console.error('Error adding entry:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalCost = (parseFloat(form.price_per_unit || 0) * parseFloat(form.quantity || 0)).toFixed(2);
    const selectedCategory = categories.find(cat => cat.id == form.category);

    const unitTypes = [
        'pieces', 'kg', 'grams', 'ltr', 'ml', 'dozen', 'pack', 'box', 
        'bottle', 'bag', 'meter', 'feet', 'inch', 'cm', 'ton', 'quintal'
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low Priority', color: 'text-gray-600', icon: '🔵', desc: 'Can wait, not urgent' },
        { value: 'medium', label: 'Medium Priority', color: 'text-blue-600', icon: '🟡', desc: 'Standard purchase' },
        { value: 'high', label: 'High Priority', color: 'text-orange-600', icon: '🟠', desc: 'Important, needed soon' },
        { value: 'urgent', label: 'Urgent', color: 'text-red-600', icon: '🔴', desc: 'Critical, needed immediately' }
    ];

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
    };

    if (formLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-lg text-gray-600">Loading form... / फॉर्म लोड हो रहा है...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    ➕ Enhanced Purchase Entry / उन्नत खरीदारी एंट्री
                </h1>

                <div className="mt-4 flex space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        ← Back / वापस
                    </button>
                    <Link 
                        href="/admin/inventory"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        📊 View All Entries
                    </Link>
                </div>
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Add New Category / नई श्रेणी जोड़ें
                        </h3>

                        <input
                            type="text"
                            placeholder="Category Name / श्रेणी नाम *"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />

                        <textarea
                            placeholder="Description (Optional) / विवरण (वैकल्पिक)"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                        />

                        <div className="flex space-x-3">
                            <button
                                onClick={handleAddCategory}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Category / श्रेणी जोड़ें
                            </button>
                            <button
                                onClick={() => setShowAddCategory(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel / रद्द करें
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Information Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">📋</span>
                        Basic Information / बुनियादी जानकारी
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category / श्रेणी *
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className={`flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        validationErrors.category ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                >
                                    <option value="">Select Category / श्रेणी चुनें</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} ({formatCurrency(cat.total_spent)} spent)
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategory(true)}
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    title="Add new category"
                                >
                                    ➕
                                </button>
                            </div>
                            {validationErrors.category && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                            )}

                            {/* Category Stats */}
                            {selectedCategory && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-800">
                                        <strong>{selectedCategory.name}</strong> - {selectedCategory.total_entries} entries
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">
                                        Total spent: {formatCurrency(selectedCategory.total_spent)}
                                    </div>
                                    {categoryStats && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            Average per item: {formatCurrency(categoryStats.total_spent / categoryStats.category.total_entries || 0)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Item Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Name / आइटम नाम *
                            </label>
                            <input
                                type="text"
                                name="item_name"
                                value={form.item_name}
                                onChange={handleChange}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    validationErrors.item_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter item name"
                                required
                            />
                            {validationErrors.item_name && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.item_name}</p>
                            )}
                        </div>

                        {/* Supplier Name with suggestions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier Name / आपूर्तिकर्ता नाम *
                            </label>
                            <input
                                type="text"
                                name="supplier_name"
                                value={form.supplier_name}
                                onChange={handleChange}
                                list="suppliers"
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    validationErrors.supplier_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter supplier name"
                                required
                            />
                            <datalist id="suppliers">
                                {suppliers.map((supplier, index) => (
                                    <option key={index} value={supplier} />
                                ))}
                            </datalist>
                            {validationErrors.supplier_name && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.supplier_name}</p>
                            )}
                            {suppliers.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Start typing to see supplier suggestions
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quantity and Pricing Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">💰</span>
                        Quantity & Pricing / मात्रा और मूल्य निर्धारण
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity / मात्रा *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={form.quantity}
                                onChange={handleChange}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    validationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                            {validationErrors.quantity && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.quantity}</p>
                            )}
                        </div>

                        {/* Unit Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Type / इकाई प्रकार *
                            </label>
                            <select
                                name="unit_type"
                                value={form.unit_type}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                                required
                            >
                                {unitTypes.map(unit => (
                                    <option key={unit} value={unit}>
                                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price per Unit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price per Unit / प्रति यूनिट कीमत *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="price_per_unit"
                                    value={form.price_per_unit}
                                    onChange={handleChange}
                                    className={`w-full border rounded-lg px-8 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        validationErrors.price_per_unit ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            {validationErrors.price_per_unit && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.price_per_unit}</p>
                            )}
                        </div>

                        {/* Purchase Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Date / खरीद दिनांक *
                            </label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={form.purchase_date}
                                onChange={handleChange}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    validationErrors.purchase_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {validationErrors.purchase_date && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.purchase_date}</p>
                            )}
                        </div>
                    </div>

                    {/* Total Cost Display */}
                    {form.price_per_unit && form.quantity && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-lg font-medium text-green-800">
                                        Total Cost / कुल लागत:
                                    </span>
                                    <div className="text-sm text-green-600 mt-1">
                                        {form.quantity} {form.unit_type} × ₹{parseFloat(form.price_per_unit || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-green-600">
                                    ₹{parseFloat(totalCost).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Details Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">⚙️</span>
                        Additional Details / अतिरिक्त विवरण
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority / प्राथमिकता
                            </label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.icon} {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-1 text-xs text-gray-500">
                                {priorityOptions.find(opt => opt.value === form.priority)?.desc}
                            </div>
                        </div>

                        {/* Is Recurring */}
                        <div className="flex items-start space-x-3 pt-6">
                            <input
                                type="checkbox"
                                id="is_recurring"
                                name="is_recurring"
                                checked={form.is_recurring}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                            <div>
                                <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                                    🔄 Recurring Purchase / नियमित खरीदारी
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Mark this if you purchase this item regularly
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags and Notes Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🏷️</span>
                        Tags & Notes / टैग्स और नोट्स
                    </h3>

                    <div className="space-y-4">

                        {/* Tags with suggestions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags / टैग्स (comma separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={form.tags}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                                placeholder="e.g., kitchen, cleaning, office supplies"
                            />

                            {commonTags.length > 0 && (
                                <div className="mt-3">
                                    <span className="text-sm text-gray-600 mb-2 block">
                                        💡 Common tags (click to add):
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {commonTags.map((tag, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => addTagToForm(tag)}
                                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors border"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes / टिप्पणी (Optional)
                            </label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                                rows="3"
                                placeholder="Additional notes about this purchase..."
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex-1 sm:flex-none flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Adding Entry...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">➕</span>
                                    Add Purchase Entry / एंट्री जोड़ें
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={loading}
                            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium transition-colors flex-1 sm:flex-none"
                        >
                            Cancel / रद्द करें
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setForm({
                                    category: '',
                                    item_name: '',
                                    price_per_unit: '',
                                    quantity: '',
                                    unit_type: 'pieces',
                                    purchase_date: new Date().toISOString().split('T')[0],
                                    supplier_name: '',
                                    notes: '',
                                    is_recurring: false,
                                    priority: 'medium',
                                    tags: ''
                                });
                                setValidationErrors({});
                                toast.success('Form cleared');
                            }}
                            disabled={loading}
                            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors flex-1 sm:flex-none"
                        >
                            🗑️ Clear Form
                        </button>
                    </div>
                </div>
            </form>

            {/* Help Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Entry Guidelines / एंट्री दिशानिर्देश
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <ul className="space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">🎯</span>
                            <span><strong>Priority Levels:</strong> Use 'Urgent' for immediate needs, 'High' for important items</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">🔄</span>
                            <span><strong>Recurring Items:</strong> Mark items you purchase regularly for better tracking</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">🏷️</span>
                            <span><strong>Tags:</strong> Use relevant tags like 'kitchen', 'cleaning', 'maintenance' for easy filtering</span>
                        </li>
                    </ul>
                    <ul className="space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">📏</span>
                            <span><strong>Units:</strong> Be specific with units (kg, ltr, pieces) for accurate inventory</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">💰</span>
                            <span><strong>Pricing:</strong> Enter actual purchase price for accurate cost tracking</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">📝</span>
                            <span><strong>Notes:</strong> Add specific details like brand, quality, or special conditions</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default withRoleGuard(CompleteEnhancedAddInventoryEntry, ['admin']);

