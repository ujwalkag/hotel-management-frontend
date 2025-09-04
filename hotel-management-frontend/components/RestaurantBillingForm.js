import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

function RestaurantBillingForm() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [includeGST, setIncludeGST] = useState(false);
  const [gstRate, setGstRate] = useState(5); // Default GST 5%
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchItems();
    fetchCategories();
    // eslint-disable-next-line
  }, [user]);

  // Fetch menu items from backend
  const fetchItems = async () => {
    try {
      const res = await fetch("/api/menu/items/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error("Failed to load items", e);
      toast.error("Failed to load items");
    }
  };

  // Fetch categories from backend (supports paginated and array response)
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/menu/categories/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error("Failed to load categories", e);
      toast.error("Failed to load categories");
    }
  };

  // Filtered items according to search and category
  const filteredItems = items.filter((item) =>
    (!selectedCategory || item.category?.id === Number(selectedCategory)) &&
    (
      item.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_hi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.name_hi?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleItemToggle = (item) => {
    const exists = selectedItems.find((i) => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, quantity) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };

  const handleGenerateBill = async () => {
    if (!customerName || !customerPhone || selectedItems.length === 0) {
      toast.error("Fill customer details and select items");
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      items: selectedItems.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
      })),
      apply_gst: includeGST,
    };

    try {
      const res = await fetch("/api/bills/create/restaurant/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.gst_rate) setGstRate(data.gst_rate);
        toast.success("Bill generated");
        // Redirect to new bill detail page!
        window.location.href = `/bills/${data.bill_id}`;
      } else {
        const text = await res.text();
        console.error("Error generating bill:", text);
        toast.error("Error generating bill: " + text);
      }
    } catch (e) {
      console.error("Server error", e);
      toast.error("Server error");
    }
  };

  const calculateBaseTotal = () =>
    selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

  const calculateGSTAmount = () => {
    if (!includeGST) return 0;
    return (calculateBaseTotal() * (gstRate / 100));
  };

  const calculateGrandTotal = () => calculateBaseTotal() + calculateGSTAmount();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        🧾 Restaurant Billing (रेस्टोरेंट बिलिंग)
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Customer Name (ग्राहक का नाम)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Phone Number (फोन नंबर)"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="🔍 Search items or categories"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Categories</option>
          {(categories || []).length === 0 && (
            <option disabled>No categories found</option>
          )}
          {(categories || []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {language === "hi" ? cat.name_hi : cat.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {filteredItems.length === 0 && (
          <div className="col-span-2 text-center text-gray-500">
            No menu items found for selected category or search.
          </div>
        )}
        {filteredItems.map((item) => {
          const isSelected = selectedItems.find((i) => i.id === item.id);
          return (
            <div
              key={item.id}
              className={`border p-3 rounded shadow-sm ${
                isSelected ? "bg-green-100" : ""
              }`}
              onClick={() => handleItemToggle(item)}
            >
              <div className="font-semibold">
                {language === "hi" ? item.name_hi : item.name_en}
              </div>
              <div className="text-sm text-gray-600">
                ₹{item.price} • {item.category?.name_en || item.category?.name_hi || "No category"}
              </div>
              {isSelected && (
                <input
                  type="number"
                  min="1"
                  value={isSelected.quantity}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    handleQuantityChange(item.id, e.target.value)
                  }
                  className="mt-2 border rounded px-2 py-1 w-20"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="gst"
          checked={includeGST}
          onChange={(e) => setIncludeGST(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="gst" className="text-sm">
          Include GST ({gstRate}%)
        </label>
      </div>

      <div className="text-md font-semibold mb-1">
        Base Amount (बिना GST): ₹{calculateBaseTotal().toFixed(2)}
      </div>
      {includeGST && (
        <div className="text-md font-semibold mb-1">
          GST @ {gstRate}% (जीएसटी): ₹{calculateGSTAmount().toFixed(2)}
        </div>
      )}
      <div className="text-xl font-bold mb-4">
        Total: ₹{calculateGrandTotal().toFixed(2)}
      </div>

      <button
        onClick={handleGenerateBill}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        ✅ Generate Bill (बिल बनाएं)
      </button>
    </div>
  );
}

export default RestaurantBillingForm;
