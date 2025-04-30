import { useEffect, useState } from "react";
import withRoleGuard from "@/utils/withRoleGuard";

function RestaurantBilling() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const totalCalc = selected.reduce((sum, id) => {
      const item = items.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);
    setTotal(totalCalc);
  }, [selected, items]);

  const fetchItems = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/list/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(data);
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bill/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_type: "restaurant", items: selected }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(`✅ Bill created! Total ₹${data.total_price}`);
      setSelected([]);
    } else {
      setMessage("❌ Error creating bill");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Restaurant Billing</h1>

      {message && <p className="mb-4 text-indigo-600">{message}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {items.map((item) => (
          <label key={item.id} className="flex items-center space-x-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggleSelect(item.id)}
            />
            <span>{item.name} – ₹{item.price}</span>
          </label>
        ))}
      </div>

      <p className="text-lg font-bold mb-4">Total: ₹{total}</p>

      <button
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        onClick={handleSubmit}
        disabled={selected.length === 0}
      >
        Generate Bill
      </button>
    </div>
  );
}

export default withRoleGuard(RestaurantBilling, ["staff"]);

