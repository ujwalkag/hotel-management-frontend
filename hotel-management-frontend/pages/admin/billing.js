import withRoleGuard from '@/utils/withRoleGuard';
import { useEffect, useState } from 'react';
import axios from 'axios';

function BillingPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get('/api/menu/');
      setMenuItems(res.data);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const handleCheckboxChange = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, value) => {
    const updated = selectedItems.map(item =>
      item.id === id ? { ...item, quantity: parseInt(value) || 1 } : item
    );
    setSelectedItems(updated);
  };

  useEffect(() => {
    const calcTotal = selectedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    setTotal(calcTotal);
  }, [selectedItems]);

  const handleSubmit = async () => {
    try {
      await axios.post('/api/bills/', {
        customer_name: customerName,
        items: selectedItems,
        total_amount: total,
      });
      alert('Bill generated successfully!');
      setSelectedItems([]);
      setCustomerName('');
      setTotal(0);
    } catch (error) {
      alert('Failed to generate bill.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Generate Bill</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Customer Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="Enter customer name"
        />
      </div>

      <h2 className="text-xl font-semibold mb-2">Select Items</h2>
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map(item => (
          <div key={item.id} className="flex items-center gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={selectedItems.some(i => i.id === item.id)}
              onChange={() => handleCheckboxChange(item)}
            />
            <label className="flex-1">{item.name} (₹{item.price})</label>
            {selectedItems.some(i => i.id === item.id) && (
              <input
                type="number"
                min="1"
                className="w-16 border rounded p-1"
                value={selectedItems.find(i => i.id === item.id)?.quantity || 1}
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-xl font-bold">
        Total: ₹{total}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Generate Bill
      </button>
    </div>
  );
}

// ✅ Only one default export
export default withRoleGuard(BillingPage, ['admin']);

