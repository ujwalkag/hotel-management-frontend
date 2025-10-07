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
  const [billData, setBillData] = useState(null); // Store bill data for printing

  const role = user?.role || "staff";

  // Calculate GST rate based on subtotal
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
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error(
        language === "hi" ? 
        "कमरे लोड नहीं हो पाए" : 
        "Failed to load rooms"
      );
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

  // 🔧 ENHANCED: Better error handling and data validation
  async function handleGenerateBill() {
    const { customer_name, customer_phone, payment_method, items } = form;
    
    // Enhanced validation
    if (!customer_name.trim()) {
      return toast.error(
        language === "hi" ? 
        "ग्राहक का नाम आवश्यक है" : 
        "Customer name is required"
      );
    }
    
    if (!customer_phone.trim()) {
      return toast.error(
        language === "hi" ? 
        "ग्राहक का फोन नंबर आवश्यक है" : 
        "Customer phone is required"
      );
    }
    
    if (!payment_method) {
      return toast.error(
        language === "hi" ? 
        "भुगतान का तरीका चुनें" : 
        "Please select payment method"
      );
    }
    
    if (items.some((it) => !it.room)) {
      return toast.error(
        language === "hi" ? 
        "सभी कमरे चुनें" : 
        "Please select all rooms"
      );
    }

    setLoading(true);
    
    // ✅ ENHANCED: Proper payload structure with validation
    const payload = {
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      aadhaar_card: form.aadhaar_card.trim() || "",
      payment_method: payment_method,
      apply_gst: form.apply_gst,
      items: items.map(({ room, days }) => ({
        room: parseInt(room), // Ensure it's a number
        quantity: parseInt(days), // Backend expects 'quantity', not 'days'
      })),
    };

    try {
      console.log("🚀 Sending payload:", payload); // Debug logging
      
      const res = await fetch("/api/bills/create/room/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(payload),
      });

      // 🔧 ENHANCED: Better error handling for different response types
      let data;
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Handle HTML error responses (500 errors)
        const htmlText = await res.text();
        console.error("Received HTML instead of JSON:", htmlText);
        throw new Error(
          language === "hi" ? 
          "सर्वर त्रुटि - कृपया व्यवस्थापक से संपर्क करें" : 
          "Server error - please contact administrator"
        );
      }

      if (!res.ok) {
        console.error("Backend error:", data);
        throw new Error(
          data.error || 
          data.detail || 
          `HTTP ${res.status}: ${res.statusText}`
        );
      }

      // Store bill data for printing
      setBillData({
        ...data,
        items: items.map(item => {
          const room = rooms.find(r => r.id === parseInt(item.room));
          return {
            name: room ? `${room.type_en} / ${room.type_hi}` : 'Unknown Room',
            quantity: item.days,
            price: room?.price_per_day || 0,
            total: (room?.price_per_day || 0) * item.days
          };
        }),
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: total
      });

      // Success notification
      toast.success(
        language === "hi" ? 
        `बिल बना: ${data.receipt_number || data.bill_id}` : 
        `Bill created: ${data.receipt_number || data.bill_id}`,
        { 
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );

      // Reset form
      setForm({
        customer_name: "",
        customer_phone: "",
        aadhaar_card: "",
        payment_method: "cash",
        items: [{ room: "", days: 1 }],
        apply_gst: false,
      });

      // Navigate to bill detail page
      if (data.bill_id) {
        router.push(`/bills/${data.bill_id}`);
      }

    } catch (error) {
      console.error("Bill creation error:", error);
      toast.error(
        language === "hi" ? 
        `बिल बनाने में त्रुटि: ${error.message}` : 
        `Error creating bill: ${error.message}`,
        { duration: 7000 }
      );
    } finally {
      setLoading(false);
    }
  }

  // 🆕 NEW: DMart-style bill printing function
  const printDetailedBill = () => {
    if (!billData || !billData.items) {
      toast.error("No bill data available for printing");
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      const printContent = generateDMartStyleReceipt(billData);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      toast.success("Bill sent to printer!");
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Error printing bill");
    }
  };

  // 🆕 NEW: Generate DMart-style receipt HTML
  const generateDMartStyleReceipt = (billData) => {
    const now = new Date();
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Receipt - ${billData.receipt_number}</title>
        <style>
            @page { margin: 0; }
            body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2; 
                margin: 0; 
                padding: 10px;
                width: 80mm; /* Standard thermal printer width */
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; }
            .total-section { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
        </style>
    </head>
    <body>
        <div class="center bold">
            HOTEL R SHAMMAD
        </div>
        <div class="center">
            Room Booking Receipt
        </div>
        <div class="line"></div>
        
        <div>Receipt: ${billData.receipt_number}</div>
        <div>Date: ${now.toLocaleDateString()}</div>
        <div>Time: ${now.toLocaleTimeString()}</div>
        <div>Customer: ${billData.customer_name}</div>
        <div>Phone: ${billData.customer_phone}</div>
        <div>Payment: ${billData.payment_method.toUpperCase()}</div>
        
        <div class="line"></div>
        
        ${billData.items.map(item => `
            <div>${item.name}</div>
            <div class="item-row">
                <span>${item.quantity} x ₹${item.price}</span>
                <span>₹${item.total.toFixed(2)}</span>
            </div>
        `).join('')}
        
        <div class="line"></div>
        
        <div class="item-row">
            <span>Subtotal:</span>
            <span>₹${billData.subtotal.toFixed(2)}</span>
        </div>
        
        ${billData.gst_amount > 0 ? `
        <div class="item-row">
            <span>GST (${billData.gst_rate}%):</span>
            <span>₹${billData.gst_amount.toFixed(2)}</span>
        </div>
        ` : ''}
        
        <div class="total-section">
            <div class="item-row bold">
                <span>TOTAL:</span>
                <span>₹${billData.total_amount.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="line"></div>
        <div class="center">
            Thank you for staying with us!
        </div>
        <div class="center">
            Visit again soon!
        </div>
    </body>
    </html>
    `;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder={language === "hi" ? "ग्राहक का नाम" : "Customer Name"}
          value={form.customer_name}
          onChange={(e) => updateField("customer_name", e.target.value)}
          className="border px-3 py-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder={language === "hi" ? "ग्राहक फोन" : "Customer Phone"}
          value={form.customer_phone}
          onChange={(e) => updateField("customer_phone", e.target.value)}
          className="border px-3 py-2 rounded w-full"
          required
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
          required
        >
          <option value="cash">{language === "hi" ? "नकद" : "Cash"}</option>
          <option value="card">{language === "hi" ? "कार्ड" : "Card"}</option>
          <option value="upi">UPI</option>
          <option value="online">{language === "hi" ? "ऑनलाइन" : "Online"}</option>
        </select>
      </div>

      {/* Room Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {language === "hi" ? "कमरे चुनें" : "Select Rooms"}
        </h2>
        <div className="space-y-4">
          {form.items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
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
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                >
                  {language === "hi" ? "हटाएं" : "Remove"}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {language === "hi" ? "कमरा जोड़ें" : "Add Room"}
          </button>
        </div>
      </div>

      {/* GST Toggle */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.apply_gst}
            onChange={(e) => updateField("apply_gst", e.target.checked)}
            className="mr-2"
          />
          <span>
            {language === "hi" 
              ? `जीएसटी लागू करें (${(gstRate * 100).toFixed(0)}%)` 
              : `Apply GST (${(gstRate * 100).toFixed(0)}%)`
            }
          </span>
        </label>
      </div>

      {/* Bill Summary */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <div className="text-lg">
          {language === "hi" ? "उप-योग" : "Subtotal"}: ₹{subtotal.toFixed(2)}
        </div>
        <div className="text-lg">
          {language === "hi" ? "जीएसटी" : "GST"}: ₹{gstAmount.toFixed(2)}
        </div>
        <div className="text-xl font-bold">
          {language === "hi" ? "कुल" : "Total"}: ₹{total.toFixed(2)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleGenerateBill}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded text-lg hover:bg-green-600 disabled:opacity-50 flex-1"
        >
          {loading 
            ? (language === "hi" ? "बिल बनाया जा रहा है..." : "Creating Bill...")
            : (language === "hi" ? "बिल बनाएं" : "Generate Bill")
          }
        </button>
        
        {billData && (
          <button
            onClick={printDetailedBill}
            className="bg-blue-500 text-white px-6 py-3 rounded text-lg hover:bg-blue-600"
          >
            {language === "hi" ? "बिल प्रिंट करें" : "Print Bill"}
          </button>
        )}
      </div>
    </div>
  );
}
