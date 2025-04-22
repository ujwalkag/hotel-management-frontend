// hotel-management-frontend/pages/billing.js

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";

export default function Billing() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "employee")) {
      router.push("/login");
    }
  }, [loading, user]);

  useEffect(() => {
    if (token) {
      fetch("/api/menu/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setMenuItems);

      fetch("/api/rooms/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setRooms);
    }
  }, [token]);

  useEffect(() => {
    const totalPrice = selectedItems.reduce((sum, id) => {
      const item = menuItems.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);
    setTotal(totalPrice);
  }, [selectedItems, menuItems]);

  const toggleItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBilling = async () => {
    const payload = {
      items: selectedItems,
      ...(selectedRoom ? { room_id: selectedRoom } : {}),
    };

    try {
      const res = await fetch("/api/bill/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Billing failed");
      const data = await res.json();
      setMessage(`✅ Bill Created! Total: ₹${data.total_amount}`);
      setSelectedItems([]);
      setSelectedRoom(null);
      setTotal(0);
    } catch (err) {
      setMessage("❌ Error creating bill.");
    }
  };

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Create Bill</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Restaurant Menu */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Select Menu Items</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between bg-white p-3 rounded shadow"
              >
                <div>
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  {item.name} ({item.category})
                </div>
                <div className="text-right font-bold">₹{item.price}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Select Room (optional)</h2>
          <select
            className="w-full p-2 rounded border"
            value={selectedRoom || ""}
            onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
          >
            <option value="">-- No Room Selected --</option>
            {rooms
              .filter((room) => room.is_available)
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_type} - ₹{room.price_per_night}
                </option>
              ))}
          </select>

          {/* Total + Submit */}
          <div className="mt-6 bg-white p-4 rounded shadow">
            <p className="text-lg">
              <span className="font-semibold">Total:</span> ₹{total}
            </p>
            <button
              onClick={handleBilling}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={selectedItems.length === 0}
            >
              Generate Bill
            </button>
            {message && <p className="mt-2 text-green-600">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

