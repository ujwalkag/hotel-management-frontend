import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function RoomBillingForm() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    aadhaar_card: "",
    payment_method: "cash",
    items: [{ room: "", days: 1 }],
    apply_gst: false,
  });
  const [loading, setLoading] = useState(false);

  const role = user?.role || "staff"; // Role fallback for safety

  const gstRate = (() => {
    const subtotal = form.items.reduce((sum, it) => {
      const r = rooms.find((r) => r.id === +it.room);
      return sum + (r?.price_per_day || 0) * it.days;
    }, 0);
    if (!form.apply_gst) return 0;
    if (subtotal < 1000) return 0;
    if (subtotal < 7500) return 0.05;
    return 0.12;
  })();

  const subtotal = form.items.reduce((sum, it) => {
    const r = rooms.find((r) => r.id === +it.room);
    return sum + (r?.price_per_day || 0) * it.days;
  }, 0);
  const gstAmount = +(subtotal * gstRate).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);

  useEffect(() => {
    if (user?.access) fetchRooms();
  }, [user]);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms/types/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error(language === "hi" ? "कमरे लोड नहीं हो पाए" : "Failed to load rooms");
    }
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateItem(idx, key, value) {
    const items = [...form.items];
    items[idx][key] = key === "days" ? Math.max(1, +value) : value;
    setForm((f) => ({ ...f, items }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { room: "", days: 1 }] }));
  }

  function removeItem(idx) {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));
  }

  async function handleGenerateBill() {
    const { customer_name, customer_phone, payment_method, items } = form;
    if (
      !customer_name ||
      !customer_phone ||
      !payment_method ||
      items.some((it) => !it.room)
    ) {
      return toast.error(
        language === "hi" 
          ? "सभी फ़ील्ड भरें और कमरे चुनें" 
          : "Fill all fields and select rooms"
      );
    }

    setLoading(true);

    // ✅ FIXED: Create correct payload structure for backend
    const payload = {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      aadhaar_card: form.aadhaar_card || "",
      payment_method: form.payment_method,
      apply_gst: form.apply_gst,
      items: form.items.map(({ room, days }) => ({
        room: parseInt(room), // Ensure it's a number
        quantity: days, // Backend expects 'quantity', not 'days'
      })),
    };

    try {
      const res = await fetch("/api/bills/create/room/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(payload), // Use the corrected payload
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Backend error:", data);
        throw new Error(data.error || data.detail || "Error creating bill");
      }

      toast.success(
        language === "hi" 
          ? `बिल बना: ${data.receipt_number || data.bill_id}` 
          : `Bill created: ${data.receipt_number || data.bill_id}`
      );
      
      // Navigate to bill detail page
      router.push(`/bills/${data.bill_id || data.id}`);
      
    } catch (error) {
      console.error("Bill creation error:", error);
      toast.error(
        language === "hi" 
          ? "बिल बनाने में त्रुटि" 
          : "Error creating bill"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {role === "admin"
          ? language === "hi" 
            ? "🧾 एडमिन रूम बिलिंग" 
            : "🧾 Admin Room Billing"
          : language === "hi" 
            ? "🧾 स्टाफ रूम बिलिंग" 
            : "🧾 Staff Room Billing"
        }
      </h1>

      {/* Customer Details */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder={language === "hi" ? "ग्राहक का नाम" : "Customer Name"}
          value={form.customer_name}
          onChange={(e) => updateField("customer_name", e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder={language === "hi" ? "ग्राहक फोन" : "Customer Phone"}
          value={form.customer_phone}
          onChange={(e) => updateField("customer_phone", e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder={language === "hi" ? "आधार कार्ड (वैकल्पिक)" : "Aadhaar Card (Optional)"}
          value={form.aadhaar_card}
          onChange={(e) => updateField("aadhaar_card", e.target.value)}
          className="border px-3 py-2 rounded w-full"
          maxLength="12"
        />
        <select
          value={form.payment_method}
          onChange={(e) => updateField("payment_method", e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="cash">{language === "hi" ? "नकद" : "Cash"}</option>
          <option value="card">{language === "hi" ? "कार्ड" : "Card"}</option>
          <option value="upi">UPI</option>
          <option value="online">{language === "hi" ? "ऑनलाइन" : "Online"}</option>
        </select>
      </div>

      {/* Room Selection */}
      <h2 className="text-xl font-semibold mb-2">
        {language === "hi" ? "कमरे चुनें" : "Select Rooms"}
      </h2>
      {form.items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-4 gap-4 mb-4">
          <select
            value={it.room}
            onChange={(e) => updateItem(idx, "room", e.target.value)}
            className="border px-3 py-2 rounded col-span-2"
            required
          >
            <option value="">
              {language === "hi" ? "कमरा चुनें" : "Select Room"}
            </option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {language === "hi" ? r.type_hi : r.type_en} - ₹{r.price_per_day}/
                {language === "hi" ? "दिन" : "day"}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={it.days}
            onChange={(e) => updateItem(idx, "days", e.target.value)}
            className="border px-3 py-2 rounded"
            placeholder={language === "hi" ? "दिन" : "Days"}
          />
          {form.items.length > 1 && (
            <button 
              type="button" 
              onClick={() => removeItem(idx)} 
              className="text-red-600 hover:text-red-800"
            >
              {language === "hi" ? "हटाएँ" : "Remove"}
            </button>
          )}
        </div>
      ))}
      
      <button 
        type="button" 
        onClick={addItem} 
        className="bg-green-500 text-white px-4 py-2 rounded mb-6 hover:bg-green-600"
      >
        {language === "hi" ? "+ और जोड़ें" : "+ Add More"}
      </button>

      {/* GST Toggle */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={form.apply_gst}
          onChange={(e) => updateField("apply_gst", e.target.checked)}
          className="mr-2"
        />
        <label>
          {language === "hi" 
            ? `जीएसटी लागू करें (${(gstRate * 100).toFixed(0)}%)` 
            : `Apply GST (${(gstRate * 100).toFixed(0)}%)`
          }
        </label>
      </div>

      {/* Bill Summary */}
      <div className="text-right mb-4 p-4 bg-gray-50 rounded">
        <p className="text-gray-700">
          {language === "hi" ? "उप-योग" : "Subtotal"}: ₹{subtotal.toFixed(2)}
        </p>
        <p className="text-gray-700">
          {language === "hi" ? "जीएसटी" : "GST"}: ₹{gstAmount.toFixed(2)}
        </p>
        <p className="text-xl font-bold">
          {language === "hi" ? "कुल" : "Total"}: ₹{total.toFixed(2)}
        </p>
      </div>

      {/* Generate Bill Button */}
      <button 
        onClick={handleGenerateBill} 
        disabled={loading || form.items.some(it => !it.room)}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
      >
        {loading ? (
          language === "hi" ? "बनाया जा रहा..." : "Generating..."
        ) : (
          language === "hi" ? "➕ रूम बिल बनाएँ" : "➕ Generate Room Bill"
        )}
      </button>
    </div>
  );
}

