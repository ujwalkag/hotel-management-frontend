import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function RestaurantBillingPage() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    async function fetchMenu() {
      const res = await fetch('/api/menu/', {
        headers: {
          Authorization: `Bearer ${user.access}`
        }
      });
      const data = await res.json();
      setMenuItems(data);
    }
    if (user) fetchMenu();
  }, [user]);

  const handleSelect = (item) => {
    const alreadySelected = selectedItems.find((i) => i.id === item.id);
    if (alreadySelected) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, quantity) => {
    setSelectedItems(
      selectedItems.map((item) => item.id === id ? { ...item, quantity: Number(quantity) } : item)
    );
  };

  const handleSubmit = async () => {
    const payload = selectedItems.map((item) => ({
      id: item.id,
      quantity: item.quantity
    }));

    const res = await fetch('/api/bills/restaurant/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.access}`
      },
      body: JSON.stringify({ items: payload })
    });

    if (res.ok) {
      alert('Restaurant Bill Created Successfully!');
      setSelectedItems([]);
    } else {
      alert('Failed to create bill.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Restaurant Bill</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="p-4 border rounded flex items-center justify-between">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-gray-500">₹{item.price}</p>
            </div>
            <div>
              <input
                type="checkbox"
                checked={!!selectedItems.find((i) => i.id === item.id)}
                onChange={() => handleSelect(item)}
              />
            </div>
          </div>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Selected Items:</h2>
          {selectedItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 mb-2">
              <p>{item.name}</p>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                className="border p-1 w-16"
              />
            </div>
          ))}
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white p-2 rounded">
            Create Bill
          </button>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(RestaurantBillingPage, ['staff']);

