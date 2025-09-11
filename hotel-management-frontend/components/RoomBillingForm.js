import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

function RoomBillingForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [days, setDays] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [applyGst, setApplyGst] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = user?.role || "staff"; // fallback for safety

  const selectedRoom = rooms.find((r) => String(r.id) === String(roomId));
  const subtotal = selectedRoom ? selectedRoom.price_per_day * days : 0;

  // ✅ Dynamic GST rate logic
  let gstRate = 0;
  if (applyGst) {
    if (subtotal < 1000) gstRate = 0;
    else if (subtotal >= 1000 && subtotal < 7500) gstRate = 0.05;
    else gstRate = 0.12;
  }

  const gstAmount = applyGst ? parseFloat((subtotal * gstRate).toFixed(2)) : 0;
  const total = subtotal + gstAmount;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : data.results || []);
      } catch {
        toast.error("Failed to load rooms / कमरे लोड नहीं हो पाए");
      }
    };

    if (user?.access) fetchRooms();
  }, [user]);

  const handleGenerateBill = async () => {
    if (!roomId || !customerName || !customerPhone || !paymentMethod || !days || isNaN(days) || days < 1) {
      toast.error("All fields are required / सभी फ़ील्ड आवश्यक हैं");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/bills/create/room/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.access}`,
      },
      body: JSON.stringify({
        room: roomId,
        days,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        apply_gst: applyGst,
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok) {
      toast.success(`Bill created / बिल बना: ${data.receipt_number}`);
      router.push(`/bills/${data.bill_id}`);
    } else {
      toast.error(data?.error || "Failed to create bill / बिल बनाने में विफल");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {role === "admin"
          ? "🧾 Admin Room Billing / एडमिन रूम बिलिंग"
          : "🧾 Staff Room Billing / स्टाफ रूम बिलिंग"}
      </h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Customer Name / ग्राहक का नाम"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Customer Phone / ग्राहक का मोबाइल"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">-- Select Room / कमरा चुनें --</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.type} - ₹{r.price_per_day}/day
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="No. of Days / दिनों की संख्या"
          value={days}
          min={1}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setDays(isNaN(val) || val < 1 ? 1 : val);
          }}
          className="border px-3 py-2 rounded w-full"
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="cash">Cash / नकद</option>
          <option value="card">Card / कार्ड</option>
          <option value="upi">UPI</option>
          <option value="online">Online / ऑनलाइन</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={applyGst}
            onChange={(e) => setApplyGst(e.target.checked)}
          />
          <label>
            Apply GST ({(gstRate * 100).toFixed(0)}%) / जीएसटी लागू करें ({(gstRate * 100).toFixed(0)}%)
          </label>
        </div>

        <div className="text-right mt-2">
          <p className="text-gray-700">Subtotal / उप-योग: ₹{subtotal.toFixed(2)}</p>
          <p className="text-gray-700">GST: ₹{gstAmount.toFixed(2)}</p>
          <p className="text-xl font-bold">Total / कुल: ₹{total.toFixed(2)}</p>
        </div>

        <button
          onClick={handleGenerateBill}
          className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? "Generating... / बना रहे हैं..."
            : "➕ Generate Room Bill / रूम बिल बनाएं"}
        </button>
      </div>
    </div>
  );
}

export default RoomBillingForm;
