// components/RestaurantBillingForm.js
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [includeGST, setIncludeGST] = useState(false);
  const [gstRate, setGstRate] = useState(5);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (user?.access) {
      fetchItems();
      fetchCategories();
    }
  }, [user]);

  async function fetchItems() {
    try {
      const res = await fetch("/api/menu/items/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error(
        language === "hi" ? "आइटम लोड करने में विफल" : "Failed to load items"
      );
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/menu/categories/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error(
        language === "hi" ? "श्रेणियाँ लोड करने में विफल" : "Failed to load categories"
      );
    }
  }

  const filteredItems = items.filter((item) =>
    (!selectedCategory || item.category?.id === +selectedCategory) &&
    (
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_hi.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function toggleItem(item) {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function changeQuantity(id, qty) {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: +qty } : i))
    );
  }

  function baseTotal() {
    return selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  function gstAmount() {
    return includeGST ? (baseTotal() * gstRate) / 100 : 0;
  }

  function grandTotal() {
    return baseTotal() + gstAmount();
  }

  async function handleGenerateBill() {
    if (!customerName || !customerPhone || selectedItems.length === 0) {
      return toast.error(
        language === "hi"
          ? "ग्राहक जानकारी भरें और आइटम चुनें"
          : "Fill customer details and select items"
      );
    }
    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      items: selectedItems.map((i) => ({ item_id: i.id, quantity: i.quantity })),
      apply_gst: includeGST,
    };
    try {
      const res = await fetch("/api/bills/create/restaurant/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setGstRate(data.gst_rate || gstRate);
      toast.success(
        language === "hi" ? "बिल जनरेट हुआ" : "Bill generated"
      );
      router.push(`/admin/billing/${data.bill_id}`);
    } catch {
      toast.error(
        language === "hi"
          ? "बिल जनरेट करने में त्रुटि"
          : "Error generating bill"
      );
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {language === "hi" ? "🧾 रेस्टोरेंट बिलिंग" : "🧾 Restaurant Billing"}
      </h1>

      {/* Customer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder={
            language === "hi" ? "ग्राहक का नाम" : "Customer Name"
          }
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder={
            language === "hi" ? "फोन नंबर" : "Phone Number"
          }
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
      </div>

      {/* Search & Category */}
      <div className="mb-4 flex gap-4">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder={
            language === "hi"
              ? "🔍 आइटम खोजें"
              : "🔍 Search items"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">
            {language === "hi" ? "सभी श्रेणियाँ" : "All Categories"}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {language === "hi" ? c.name_hi : c.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {filteredItems.map((item) => {
          const sel = selectedItems.find((i) => i.id === item.id);
          return (
            <div
              key={item.id}
              className={`border p-3 rounded cursor-pointer ${
                sel ? "bg-green-100" : ""
              }`}
              onClick={() => toggleItem(item)}
            >
              <div className="font-semibold">
                {language === "hi" ? item.name_hi : item.name_en}
              </div>
              <div className="text-gray-600">₹{item.price}</div>
              {sel && (
                <input
                  type="number"
                  min="1"
                  value={sel.quantity}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    changeQuantity(item.id, e.target.value)
                  }
                  className="mt-2 border rounded px-2 py-1 w-20"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* GST Toggle */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="gst"
          checked={includeGST}
          onChange={(e) => setIncludeGST(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="gst" className="text-sm">
          {language === "hi"
            ? `जीएसटी शामिल करें (${gstRate}%)`
            : `Include GST (${gstRate}%)`}
        </label>
      </div>

      {/* Totals */}
      <div className="mb-1">
        {language === "hi" ? "बिना GST राशि" : "Base Amount"}: ₹
        {baseTotal().toFixed(2)}
      </div>
      {includeGST && (
        <div className="mb-1">
          {language === "hi" ? "जीएसटी राशि" : "GST Amount"}: ₹
          {gstAmount().toFixed(2)}
        </div>
      )}
      <div className="text-xl font-bold mb-4">
        {language === "hi" ? "कुल" : "Total"}: ₹{grandTotal().toFixed(2)}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateBill}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {language === "hi" ? "✅ बिल बनाएँ" : "✅ Generate Bill"}
      </button>
    </div>
  );
}

export default RestaurantBillingForm;

