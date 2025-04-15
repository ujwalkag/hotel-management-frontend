import React, { useState, useEffect } from 'react';
import axios from 'axios';
import withRoleGuard from '@/utils/withRoleGuard';

const RestaurantBilling = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [guest, setGuest] = useState('');
  const [total, setTotal] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false);

  useEffect(() => {
    axios.get('/api/menu-items/')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const sum = selectedItems.reduce((acc, item) => acc + item.price, 0);
    setTotal(sum);
  }, [selectedItems]);

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const generateBill = async () => {
    try {
      await axios.post('/api/restaurant-billings/', {
        guest,
        items: selectedItems.map(i => i.id),
        total_price: total,
      });
      setBillGenerated(true);
    } catch (err) {
      console.error('Error generating bill:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Restaurant Billing</h2>
      <input
        type="text"
        placeholder="Guest Name"
        onChange={e => setGuest(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <div className="mb-4">
        {items.map(item => (
          <label key={item.id} className="block">
            <input
              type="checkbox"
              checked={!!selectedItems.find(i => i.id === item.id)}
              onChange={() => toggleItem(item)}
            /> {item.name} - ₹{item.price}
          </label>
        ))}
      </div>
      <div className="mb-2 font-semibold">Total: ₹{total}</div>
      <button onClick={generateBill} className="bg-blue-600 text-white px-4 py-2 rounded">
        Generate Bill
      </button>
      {billGenerated && <p className="mt-2 text-green-700">Bill generated successfully!</p>}
    </div>
  );
};

// ✅ Correct component passed to withRoleGuard
export default withRoleGuard(RestaurantBilling, ['admin', 'staff']);

