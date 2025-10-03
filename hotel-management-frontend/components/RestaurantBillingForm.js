
// components/RestaurantBillingForm.js - ENHANCED WITH D-MART & CUSTOMER HANDLING
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

function RestaurantBillingForm() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Enhanced customer information with optional fields
  const [customerInfo, setCustomerInfo] = useState({
    name: "Guest",
    phone: "+91",
    email: "",
    address: ""
  });

  // Enhanced GST and pricing settings
  const [billingSettings, setBillingSettings] = useState({
    includeGST: true,
    gstRate: 18,
    interstate: false,
    discountPercent: 0,
    discountAmount: 0,
    paymentMethod: 'cash',
    tableNumber: '',
    specialInstructions: ''
  });

  // Bill calculation state - D-mart style
  const [billCalculation, setBillCalculation] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    total: 0,
    savings: 0
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [billPreview, setBillPreview] = useState(null);

  // Load initial data
  useEffect(() => {
    if (user?.access) {
      loadInitialData();
    }
  }, [user]);

  // Recalculate bill when items or settings change
  useEffect(() => {
    calculateBill();
  }, [selectedItems, billingSettings]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchItems(),
        fetchCategories(),
        fetchAvailableTables()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      // Try new restaurant API first, fallback to old menu API
      let res = await fetch("/api/restaurant/menu-for-ordering/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Flatten categories and items structure
        const allItems = [];
        data.forEach(categoryData => {
          categoryData.items.forEach(item => {
            allItems.push({
              ...item,
              category: categoryData.category
            });
          });
        });
        setItems(allItems);
      } else {
        // Fallback to old menu API
        res = await fetch("/api/menu/items/", {
          headers: { Authorization: `Bearer ${user.access}` },
        });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error(
        language === "hi" ? "आइटम लोड करने में विफल" : "Failed to load items"
      );
    }
  };

  const fetchCategories = async () => {
    try {
      // Try restaurant API first
      let res = await fetch("/api/restaurant/menu-categories/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });

      if (!res.ok) {
        // Fallback to menu API
        res = await fetch("/api/menu/categories/", {
          headers: { Authorization: `Bearer ${user.access}` },
        });
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(
        language === "hi" ? "श्रेणियाँ लोड करने में विफल" : "Failed to load categories"
      );
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const res = await fetch("/api/restaurant/tables/?available_only=true", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setAvailableTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tables:", error);
    }
  };

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const categoryMatch = !selectedCategory ||
      item.category?.id === +selectedCategory ||
      item.category === selectedCategory;

    const searchMatch = !searchQuery ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.name_en && item.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.name_hi && item.name_hi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return categoryMatch && searchMatch;
  });

  // Item management functions
  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, {
        ...item,
        quantity: 1,
        selectedPrice: item.price,
        itemDiscount: 0,
        notes: ''
      }];
    });
  };

  const updateItemQuantity = (id, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelectedItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  const updateItemPrice = (id, price) => {
    const newPrice = Math.max(0, parseFloat(price) || 0);
    setSelectedItems(prev =>
      prev.map(item => item.id === id ? { ...item, selectedPrice: newPrice } : item)
    );
  };

  const removeItem = (id) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  // Add custom item functionality
  const addCustomItem = () => {
    const name = prompt("Custom item name:");
    if (!name) return;

    const price = prompt("Price (₹):");
    const itemPrice = parseFloat(price);
    if (!itemPrice || itemPrice <= 0) {
      toast.error("Please enter valid price");
      return;
    }

    const customItem = {
      id: Date.now(), // Temporary ID
      name: name,
      price: itemPrice,
      category: { name: 'Custom' },
      isCustom: true
    };

    setSelectedItems(prev => [...prev, {
      ...customItem,
      quantity: 1,
      selectedPrice: itemPrice,
      itemDiscount: 0,
      notes: ''
    }]);

    toast.success("Custom item added");
  };

  // D-mart style bill calculation function
  const calculateBill = () => {
    // Calculate subtotal
    const subtotal = selectedItems.reduce((sum, item) => {
      const itemTotal = (item.selectedPrice * item.quantity) - (item.itemDiscount || 0);
      return sum + Math.max(0, itemTotal);
    }, 0);

    // Calculate discount
    let discountAmount = 0;
    if (billingSettings.discountPercent > 0) {
      discountAmount = (subtotal * billingSettings.discountPercent) / 100;
    }
    if (billingSettings.discountAmount > 0) {
      discountAmount = Math.max(discountAmount, billingSettings.discountAmount);
    }

    // Taxable amount
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // GST calculation
    let gstAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (billingSettings.includeGST && billingSettings.gstRate > 0) {
      gstAmount = (taxableAmount * billingSettings.gstRate) / 100;

      if (billingSettings.interstate) {
        igstAmount = gstAmount;
      } else {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      }
    }

    // Final total
    const total = taxableAmount + gstAmount;
    const savings = discountAmount + selectedItems.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);

    setBillCalculation({
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
      savings
    });
  };

  // Preview bill before generation
  const previewBill = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setBillPreview({
      customer: customerInfo,
      items: selectedItems,
      calculation: billCalculation,
      settings: billingSettings,
      timestamp: new Date().toISOString()
    });
  };

  // Generate final D-mart style bill - ENHANCED TO USE CORRECT ENDPOINTS
  const handleGenerateBill = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setLoading(true);

    // Use customer name or default to Guest (making it optional)
    const finalCustomerName = customerInfo.name.trim() || 'Guest';
    const finalCustomerPhone = customerInfo.phone.trim() || '';

    // Prepare payload for enhanced billing endpoint
    const payload = {
   customer_name: finalCustomerName,
   customer_phone: finalCustomerPhone,
   payment_method: billingSettings.paymentMethod,

   // Only these two fields per item:
   items: selectedItems.map(item => ({
     item_id: item.id,
     quantity: item.quantity,
   })),

   apply_gst: billingSettings.includeGST,
   discount_amount: billingSettings.discountAmount,
   discount_percentage: billingSettings.discountPercent,

   // Optional:
   service_charge: billingSettings.serviceCharge || 0,
   notify_customer: billingSettings.notifyCustomer || false,
 };
    try {
      // Try enhanced billing first, then fallback to regular
      let res = await fetch("/api/bills/create/restaurant/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to generate bill");
      }

      // Success notification with D-mart style details
      toast.success(
        `✅ D-mart Style Bill Generated!\n` +
        `Receipt: ${data.receipt_number || 'GENERATED'}\n` +
        `Customer: ${finalCustomerName}\n` +
        `Total: ₹${data.total_amount || billCalculation.total.toFixed(2)}\n` +
        `🧾 Professional receipt created!`,
        {
          duration: 6000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );

      // Reset form
      setSelectedItems([]);
      setCustomerInfo({ name: "Guest", phone: "", email: "", address: "" });
      setBillingSettings(prev => ({
        ...prev,
        discountPercent: 0,
        discountAmount: 0,
        specialInstructions: ''
      }));
      setBillPreview(null);

      // Navigate to bill details if available
      if (data.bill_id) {
        router.push(`/admin/billing/${data.bill_id}`);
      }

    } catch (error) {
      console.error('Bill generation error:', error);
      toast.error(`Error generating bill: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && selectedItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Restaurant Billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === "hi" ? "🧾 रेस्टोरेंट बिलिंग सिस्टम" : "🧾 Restaurant Billing System"}
            </h1>
            <p className="text-green-100">
              {language === "hi"
                ? "पूर्ण GST अनुपालन के साथ पेशेवर D-mart स्टाइल बिलिंग"
                : "Professional D-mart style billing with complete GST compliance"
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₹{billCalculation.total.toFixed(2)}</div>
            <div className="text-sm text-green-200">
              {selectedItems.length} {language === "hi" ? "आइटम" : "items"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Item Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">👤</span>
              {language === "hi" ? "ग्राहक जानकारी" : "Customer Information"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi" ? "नाम (वैकल्पिक)" : "Name (Optional)"}
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === "hi" ? "ग्राहक का नाम (Guest के लिए खाली छोड़ें)" : "Customer Name (leave empty for Guest)"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === "hi" ? "खाली छोड़ने पर 'Guest' हो जाएगा" : "Defaults to 'Guest' if empty"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi" ? "फ़ोन (वैकल्पिक)" : "Phone (Optional)"}
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === "hi" ? "फ़ोन नंबर (वैकल्पिक)" : "Phone Number (optional)"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi" ? "ईमेल (वैकल्पिक)" : "Email (Optional)"}
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === "hi" ? "ईमेल पता" : "Email Address"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi" ? "टेबल (वैकल्पिक)" : "Table (Optional)"}
                </label>
                <select
                  value={billingSettings.tableNumber}
                  onChange={(e) => setBillingSettings(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === "hi" ? "कोई टेबल नहीं" : "No Table"}</option>
                  {availableTables.map(table => (
                    <option key={table.id} value={table.table_number}>
                      {language === "hi"
                        ? `टेबल ${table.table_number} (कैप: ${table.capacity})`
                        : `Table ${table.table_number} (Cap: ${table.capacity})`
                      }
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="mr-2">🔍</span>
                {language === "hi" ? "मेनू आइटम" : "Menu Items"}
              </h3>
              <button
                onClick={addCustomItem}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {language === "hi" ? "+ कस्टम आइटम" : "+ Custom Item"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "hi" ? "आइटम खोजें..." : "Search items..."}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {language === "hi" ? "सभी श्रेणियाँ" : "All Categories"}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {language === "hi" ? (cat.name_hi || cat.name) : (cat.name_en || cat.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredItems.map(item => {
                const isSelected = selectedItems.find(i => i.id === item.id);
                const itemName = language === "hi"
                  ? (item.name_hi || item.name)
                  : (item.name_en || item.name || item.name);

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${isSelected
                      ? "bg-blue-50 border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    onClick={() => toggleItem(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">
                        {itemName}
                      </h4>
                      {isSelected && (
                        <span className="text-blue-500 text-lg">✓</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">₹{item.price}</p>
                    {item.category && (
                      <p className="text-xs text-gray-500">
                        {language === "hi"
                          ? (item.category.name_hi || item.category.name)
                          : (item.category.name_en || item.category.name || item.category)
                        }
                      </p>
                    )}
                    {/* Availability indicator */}
                    {item.availability && item.availability !== 'available' && (
                      <span className="text-xs text-red-500">
                        {item.availability}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Bill Details */}
        <div className="space-y-6">
          {/* Selected Items */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🛒</span>
              {language === "hi" ? "चुने गए आइटम" : "Selected Items"}
            </h3>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🛒</div>
                <p>{language === "hi" ? "कोई आइटम नहीं चुना गया" : "No items selected"}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedItems.map(item => {
                  const itemName = language === "hi"
                    ? (item.name_hi || item.name)
                    : (item.name_en || item.name || item.name);

                  return (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">
                          {itemName}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">
                            {language === "hi" ? "मात्रा" : "Qty"}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                            className="w-full text-sm border rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">
                            {language === "hi" ? "कीमत" : "Price"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.selectedPrice}
                            onChange={(e) => updateItemPrice(item.id, e.target.value)}
                            className="w-full text-sm border rounded px-2 py-1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === "hi" ? "कुल:" : "Total:"}
                        </span>
                        <span className="font-medium">
                          ₹{((item.selectedPrice * item.quantity) - (item.itemDiscount || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* D-mart Style Billing Settings */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="mr-2">⚙️</span>
                {language === "hi" ? "D-mart स्टाइल बिलिंग सेटिंग्स" : "D-mart Style Billing Settings"}
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-500 text-sm hover:text-blue-700"
              >
                {showAdvanced ? (language === "hi" ? "छुपाएं" : "Hide") : (language === "hi" ? "उन्नत" : "Advanced")}
              </button>
            </div>

            <div className="space-y-4">
              {/* GST Settings */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={billingSettings.includeGST}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, includeGST: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="font-medium">
                    {language === "hi" ? "GST लागू करें" : "Apply GST"}
                  </span>
                </label>

                {billingSettings.includeGST && (
                  <div className="space-y-2 ml-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        {language === "hi" ? "GST दर (%)" : "GST Rate (%)"}
                      </label>
                      <select
                        value={billingSettings.gstRate}
                        onChange={(e) => setBillingSettings(prev => ({ ...prev, gstRate: parseFloat(e.target.value) }))}
                        className="w-full border rounded px-3 py-1"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={billingSettings.interstate}
                        onChange={(e) => setBillingSettings(prev => ({ ...prev, interstate: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {language === "hi" ? "अंतर्राज्यीय (IGST)" : "Interstate (IGST)"}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Discount Settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === "hi" ? "छूट (%)" : "Discount (%)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={billingSettings.discountPercent}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === "hi" ? "छूट (₹)" : "Discount (₹)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingSettings.discountAmount}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {language === "hi" ? "भुगतान का तरीका" : "Payment Method"}
                </label>
                <select
                  value={billingSettings.paymentMethod}
                  onChange={(e) => setBillingSettings(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="cash">{language === "hi" ? "नकद" : "Cash"}</option>
                  <option value="card">{language === "hi" ? "कार्ड" : "Card"}</option>
                  <option value="upi">UPI</option>
                  <option value="online">{language === "hi" ? "ऑनलाइन" : "Online"}</option>
                  <option value="wallet">{language === "hi" ? "वॉलेट" : "Wallet"}</option>
                </select>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === "hi" ? "विशेष निर्देश" : "Special Instructions"}
                  </label>
                  <textarea
                    value={billingSettings.specialInstructions}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    className="w-full border rounded px-2 py-1"
                    rows={2}
                    placeholder={language === "hi" ? "कोई विशेष निर्देश..." : "Any special instructions..."}
                  />
                </div>
              )}
            </div>
          </div>

          {/* D-mart Style Bill Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🧾</span>
              {language === "hi" ? "बिल सारांश" : "Bill Summary"}
            </h3>

            <div className="space-y-2 text-sm border p-4 rounded bg-gray-50">
              {/* Receipt Header */}
              <div className="text-center border-b pb-2 mb-2">
                <div className="font-bold">
                  {language === "hi" ? "होटल रेस्टोरेंट" : "HOTEL RESTAURANT"}
                </div>
                <div className="text-xs text-gray-600">
                  {language === "hi" ? "D-mart शैली बिल" : "D-mart Style Bill"}
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="flex justify-between">
                <span>{language === "hi" ? "उप-योग:" : "Subtotal:"}</span>
                <span>₹{billCalculation.subtotal.toFixed(2)}</span>
              </div>

              {billCalculation.savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{language === "hi" ? "कुल बचत:" : "Total Savings:"}</span>
                  <span>-₹{billCalculation.savings.toFixed(2)}</span>
                </div>
              )}

              {billCalculation.discountAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>{language === "hi" ? "बिल छूट:" : "Bill Discount:"}</span>
                  <span>-₹{billCalculation.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {billingSettings.includeGST && billCalculation.gstAmount > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-600 border-t pt-1">
                    <span>{language === "hi" ? "कर योग्य राशि:" : "Taxable Amount:"}</span>
                    <span>₹{billCalculation.taxableAmount.toFixed(2)}</span>
                  </div>

                  {billingSettings.interstate ? (
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>IGST ({billingSettings.gstRate}%):</span>
                      <span>₹{billCalculation.igstAmount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>CGST ({(billingSettings.gstRate / 2)}%):</span>
                        <span>₹{billCalculation.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>SGST ({(billingSettings.gstRate / 2)}%):</span>
                        <span>₹{billCalculation.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>{language === "hi" ? "कुल राशि:" : "Total Amount:"}</span>
                <span className="text-green-600">₹{billCalculation.total.toFixed(2)}</span>
              </div>

              {billCalculation.savings > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                  <div className="text-green-700 font-medium text-center text-xs">
                    🎉 {language === "hi"
                      ? `आपने ₹${billCalculation.savings.toFixed(2)} की बचत की!`
                      : `You Saved ₹${billCalculation.savings.toFixed(2)}!`
                    } 🎉
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={previewBill}
                disabled={selectedItems.length === 0}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                👁️ {language === "hi" ? "बिल प्रीव्यू" : "Preview Bill"}
              </button>

              <button
                onClick={handleGenerateBill}
                disabled={selectedItems.length === 0 || loading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {language === "hi" ? "D-mart स्टाइल बिल जनरेट कर रहे हैं..." : "Generating D-mart Style Bill..."}
                  </div>
                ) : (
                  `🧾 ${language === "hi"
                    ? `D-mart स्टाइल बिल जनरेट करें (₹${billCalculation.total.toFixed(2)})`
                    : `Generate D-mart Style Bill (₹${billCalculation.total.toFixed(2)})`
                  }`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {billPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {language === "hi" ? "D-mart स्टाइल बिल प्रीव्यू" : "D-mart Style Bill Preview"}
                </h3>
                <button
                  onClick={() => setBillPreview(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium">
                    {language === "hi" ? "ग्राहक:" : "Customer:"}
                  </h4>
                  <p>{billPreview.customer.name}</p>
                  <p>{billPreview.customer.phone || 'N/A'}</p>
                </div>

                <div>
                  <h4 className="font-medium">
                    {language === "hi" ? "आइटम:" : "Items:"}
                  </h4>
                  {billPreview.items.map(item => {
                    const itemName = language === "hi"
                      ? (item.name_hi || item.name)
                      : (item.name_en || item.name || item.name);
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span>{itemName} x {item.quantity}</span>
                        <span>₹{(item.selectedPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>{language === "hi" ? "कुल:" : "Total:"}</span>
                    <span>₹{billPreview.calculation.total.toFixed(2)}</span>
                  </div>
                  {billPreview.calculation.savings > 0 && (
                    <div className="text-green-600 text-center">
                      🎉 {language === "hi"
                        ? `आपने ₹${billPreview.calculation.savings.toFixed(2)} की बचत की!`
                        : `You Saved ₹${billPreview.calculation.savings.toFixed(2)}!`
                      } 🎉
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setBillPreview(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
                >
                  {language === "hi" ? "बंद करें" : "Close"}
                </button>
                <button
                  onClick={() => {
                    setBillPreview(null);
                    handleGenerateBill();
                  }}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg"
                >
                  {language === "hi" ? "पुष्टि करें और जनरेट करें" : "Confirm & Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantBillingForm;


