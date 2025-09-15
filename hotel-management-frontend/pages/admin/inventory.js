// pages/admin/inventory.js - COMPLETE ENHANCED VERSION
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function EnhancedInventoryManagement() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [filterOptions, setFilterOptions] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);

    // Enhanced filter state with all new options
    const [filters, setFilters] = useState({
        // Date filters
        start_date: '',
        end_date: '',

        // Legacy filters for backward compatibility
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),

        // Enhanced filters
        category: '',
        supplier: '',
        priority: '',
        min_cost: '',
        max_cost: '',
        unit_type: '',
        is_recurring: '',
        tags: '',
        search: '',
        sort_by: '-purchase_date'
    });

    // Quick filter presets
    const quickFilters = [
        { 
            label: 'This Month', 
            icon: '📅',
            action: () => setQuickFilter('this_month') 
        },
        { 
            label: 'Last 30 Days', 
            icon: '📊',
            action: () => setQuickFilter('last_30_days') 
        },
        { 
            label: 'This Quarter', 
            icon: '📈',
            action: () => setQuickFilter('this_quarter') 
        },
        { 
            label: 'High Priority', 
            icon: '🔥',
            action: () => setFilters({...filters, priority: 'high', start_date: '', end_date: ''}) 
        },
        { 
            label: 'Urgent Items', 
            icon: '⚡',
            action: () => setFilters({...filters, priority: 'urgent', start_date: '', end_date: ''}) 
        },
        { 
            label: 'Recurring', 
            icon: '🔄',
            action: () => setFilters({...filters, is_recurring: 'true', start_date: '', end_date: ''}) 
        }
    ];

    useEffect(() => {
        if (user?.access) {
            fetchFilterOptions();
            fetchDashboardStats();
        }
    }, [user]);

    useEffect(() => {
        if (user?.access) {
            fetchData();
            fetchAnalytics();
        }
    }, [filters, user]);

    const setQuickFilter = (type) => {
        const today = new Date();
        let startDate, endDate;

        switch (type) {
            case 'this_month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last_30_days':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = today;
                break;
            case 'this_quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
                break;
            default:
                return;
        }

        setFilters({
            ...filters,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            month: '',
            year: ''
        });
    };

    const fetchFilterOptions = async () => {
        try {
            const res = await fetch('/api/inventory/entries/filter_options/', {
                headers: { Authorization: `Bearer ${user?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFilterOptions(data);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const res = await fetch('/api/inventory/entries/dashboard_stats/', {
                headers: { Authorization: `Bearer ${user?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDashboardStats(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams();

            // Add all non-empty filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });

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
                setEntries(Array.isArray(entriesData) ? entriesData : entriesData.results || []);
            } else {
                console.error('Failed to fetch entries');
                toast.error('Failed to load inventory entries');
            }

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading inventory data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });

            const res = await fetch(`/api/inventory/entries/spending_analytics/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user?.access}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const clearFilters = () => {
        setFilters({
            start_date: '',
            end_date: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            category: '',
            supplier: '',
            priority: '',
            min_cost: '',
            max_cost: '',
            unit_type: '',
            is_recurring: '',
            tags: '',
            search: '',
            sort_by: '-purchase_date'
        });
        toast.success('Filters cleared');
    };

    const exportData = () => {
        // Convert entries to CSV
        if (entries.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Date', 'Item', 'Category', 'Quantity', 'Unit', 'Price/Unit', 'Total Cost', 'Supplier', 'Priority', 'Tags'];
        const csvContent = [
            headers.join(','),
            ...entries.map(entry => [
                entry.purchase_date,
                `"${entry.item_name}"`,
                entry.category_name,
                entry.quantity,
                entry.unit_type || 'pieces',
                entry.price_per_unit,
                entry.total_cost,
                `"${entry.supplier_name}"`,
                entry.priority,
                `"${entry.tags || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported to CSV');
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            low: { class: 'bg-gray-100 text-gray-800', icon: '🔵' },
            medium: { class: 'bg-blue-100 text-blue-800', icon: '🟡' },
            high: { class: 'bg-orange-100 text-orange-800', icon: '🟠' },
            urgent: { class: 'bg-red-100 text-red-800', icon: '🔴' }
        };

        const badge = badges[priority] || badges.medium;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                <span className="mr-1">{badge.icon}</span>
                {priority?.charAt(0)?.toUpperCase() + priority?.slice(1) || 'Medium'}
            </span>
        );
    };

    const getRecurringBadge = (isRecurring) => {
        if (!isRecurring) return null;

        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                🔄 Recurring
            </span>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    📊 Enhanced Inventory Analytics / उन्नत इन्वेंट्री विश्लेषण
                </h1>

                <div className="mt-4 flex flex-wrap gap-3">
                    <Link 
                        href="/admin/inventory-add-entry" 
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                        ➕ Add Purchase / खरीदारी जोड़ें
                    </Link>
                    <button
                        onClick={exportData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        📥 Export CSV
                    </button>
                    <Link 
                        href="/admin/dashboard" 
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium transition-colors"
                    >
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {/* Analytics Summary Cards */}
            {analyticsData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold text-xl">💰</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(analyticsData.total_spent)}
                                </p>
                                {dashboardStats?.last_30_days_spent && (
                                    <p className="text-xs text-gray-400">
                                        Last 30 days: {formatCurrency(dashboardStats.last_30_days_spent)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-xl">#</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Entries</p>
                                <p className="text-2xl font-bold text-blue-600">{analyticsData.total_entries}</p>
                                <p className="text-xs text-gray-400">
                                    {dashboardStats?.total_suppliers || 0} suppliers
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-xl">📊</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg per Entry</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(analyticsData.avg_cost_per_entry)}
                                </p>
                                <p className="text-xs text-gray-400">Per purchase</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-orange-600 font-bold text-xl">🏷️</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Categories Used</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {analyticsData.category_breakdown?.length || 0}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Total: {categories.length} categories
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Filter Buttons */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Quick Filters / त्वरित फिल्टर</h3>
                    <span className="text-sm text-gray-500">
                        Showing {entries.length} entries
                    </span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {quickFilters.map((filter, index) => (
                        <button
                            key={index}
                            onClick={filter.action}
                            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm hover:bg-blue-200 transition-colors font-medium flex items-center"
                        >
                            <span className="mr-2">{filter.icon}</span>
                            {filter.label}
                        </button>
                    ))}
                    <button
                        onClick={clearFilters}
                        className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm hover:bg-red-200 transition-colors font-medium flex items-center"
                    >
                        <span className="mr-2">🗑️</span>
                        Clear All
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Advanced Filters / उन्नत फिल्टर</h3>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                    >
                        {showAdvancedFilters ? '▲ Hide Advanced' : '▼ Show Advanced'}
                    </button>
                </div>

                {/* Basic Filters - Always Visible */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Date Range Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value, month: '', year: ''})}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => setFilters({...filters, end_date: e.target.value, month: '', year: ''})}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({...filters, category: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search items, suppliers..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Advanced filters - show when expanded */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input
                                type="text"
                                placeholder="Supplier name..."
                                value={filters.supplier}
                                onChange={(e) => setFilters({...filters, supplier: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Priorities</option>
                                <option value="low">🔵 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="urgent">🔴 Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Cost (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={filters.min_cost}
                                onChange={(e) => setFilters({...filters, min_cost: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Cost (₹)</label>
                            <input
                                type="number"
                                placeholder="999999"
                                value={filters.max_cost}
                                onChange={(e) => setFilters({...filters, max_cost: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                            <input
                                type="text"
                                placeholder="kg, ltr, pieces..."
                                value={filters.unit_type}
                                onChange={(e) => setFilters({...filters, unit_type: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                            <select
                                value={filters.is_recurring}
                                onChange={(e) => setFilters({...filters, is_recurring: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Items</option>
                                <option value="true">🔄 Recurring Only</option>
                                <option value="false">One-time Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <input
                                type="text"
                                placeholder="Search by tags..."
                                value={filters.tags}
                                onChange={(e) => setFilters({...filters, tags: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="-purchase_date">📅 Date (Newest)</option>
                                <option value="purchase_date">📅 Date (Oldest)</option>
                                <option value="-total_cost">💰 Cost (Highest)</option>
                                <option value="total_cost">💰 Cost (Lowest)</option>
                                <option value="item_name">🔤 Name (A-Z)</option>
                                <option value="-item_name">🔤 Name (Z-A)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Active Filters Summary */}
                {Object.entries(filters).some(([key, value]) => value !== '' && key !== 'sort_by' && key !== 'month' && key !== 'year') && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(filters).map(([key, value]) => {
                                if (value !== '' && key !== 'sort_by' && key !== 'month' && key !== 'year') {
                                    return (
                                        <span key={key} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                            {key}: {value}
                                        </span>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Analytics Charts/Breakdown */}
            {analyticsData?.category_breakdown && analyticsData.category_breakdown.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Category Breakdown */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">📊</span>
                            Category Breakdown / श्रेणी विश्लेषण
                        </h3>
                        <div className="space-y-3">
                            {analyticsData.category_breakdown.slice(0, 6).map((cat, index) => {
                                const percentage = analyticsData.total_spent > 0 ? (cat.total_spent / analyticsData.total_spent * 100) : 0;
                                return (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div>
                                            <span className="font-medium text-gray-800">{cat.category__name}</span>
                                            <div className="text-sm text-gray-500">{cat.entry_count} items</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-600">
                                                {formatCurrency(cat.total_spent)}
                                            </div>
                                            <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Supplier Breakdown */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">🏪</span>
                            Top Suppliers / शीर्ष आपूर्तिकर्ता
                        </h3>
                        <div className="space-y-3">
                            {analyticsData.supplier_breakdown?.slice(0, 6).map((supplier, index) => {
                                const percentage = analyticsData.total_spent > 0 ? (supplier.total_spent / analyticsData.total_spent * 100) : 0;
                                return (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div>
                                            <span className="font-medium text-gray-800">{supplier.supplier_name}</span>
                                            <div className="text-sm text-gray-500">{supplier.entry_count} purchases</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-blue-600">
                                                {formatCurrency(supplier.total_spent)}
                                            </div>
                                            <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Purchase Entries / खरीदारी एंट्रियां ({entries.length})
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Sort: {filters.sort_by}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-lg text-gray-600">Loading... / लोड हो रहा है...</span>
                            </div>
                        </div>
                    ) : entries.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">
                                                {new Date(entry.purchase_date).toLocaleDateString('en-IN')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(entry.purchase_date).toLocaleDateString('en-IN', { weekday: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium text-gray-900">{entry.item_name}</div>
                                                {entry.tags && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {entry.tags.split(',').map((tag, idx) => (
                                                            <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                                                {tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {entry.notes && (
                                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={entry.notes}>
                                                        📝 {entry.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {entry.category_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{entry.quantity}</div>
                                            <div className="text-xs text-gray-500">{entry.unit_type || 'pcs'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(entry.price_per_unit)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            {formatCurrency(entry.total_cost)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium">{entry.supplier_name}</div>
                                            {getRecurringBadge(entry.is_recurring)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getPriorityBadge(entry.priority)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-500">
                                <div className="text-6xl mb-4">📦</div>
                                <p className="text-xl font-medium mb-2">No entries found / कोई एंट्री नहीं मिली</p>
                                <p className="text-gray-400 mb-6">
                                    {Object.entries(filters).some(([key, value]) => value !== '' && key !== 'sort_by' && key !== 'month' && key !== 'year')
                                        ? 'Try adjusting your filters / अपने फिल्टर समायोजित करने का प्रयास करें'
                                        : 'Add your first inventory entry / अपनी पहली इन्वेंट्री एंट्री जोड़ें'
                                    }
                                </p>
                                <Link 
                                    href="/admin/inventory-add-entry"
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors inline-flex items-center"
                                >
                                    <span className="mr-2">➕</span>
                                    Add First Entry / पहली एंट्री जोड़ें
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table Footer with Summary */}
                {entries.length > 0 && analyticsData && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                            <div className="text-gray-600">
                                Showing {entries.length} of {entries.length} entries
                            </div>
                            <div className="flex space-x-6 text-gray-600">
                                <span>Total: <strong className="text-green-600">{formatCurrency(analyticsData.total_spent)}</strong></span>
                                <span>Avg: <strong className="text-blue-600">{formatCurrency(analyticsData.avg_cost_per_entry)}</strong></span>
                                <span>Entries: <strong>{analyticsData.total_entries}</strong></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help & Tips Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Tips & Features / सुझाव और सुविधाएं
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <ul className="space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">🎯</span>
                            <span><strong>Quick Filters:</strong> Use preset filters for common date ranges and priority levels</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">🔍</span>
                            <span><strong>Advanced Search:</strong> Search across items, suppliers, notes, and tags simultaneously</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">📊</span>
                            <span><strong>Real-time Analytics:</strong> All calculations update instantly as you apply filters</span>
                        </li>
                    </ul>
                    <ul className="space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">💰</span>
                            <span><strong>Cost Filtering:</strong> Set min/max cost ranges to find specific budget items</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">🏷️</span>
                            <span><strong>Tag System:</strong> Use tags like 'kitchen', 'cleaning', 'urgent' for better organization</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">📥</span>
                            <span><strong>Export Data:</strong> Download filtered results as CSV for external analysis</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default withRoleGuard(EnhancedInventoryManagement, ['admin']);

