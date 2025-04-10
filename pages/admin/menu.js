import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', price: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/menu-items/');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`/api/menu-items/${editingId}/`, form);
      } else {
        await axios.post('/api/menu-items/', form);
      }
      setForm({ name: '', category: '', price: '' });
      setEditingId(null);
      fetchItems();
    } catch (error) {
      console.error('Error submitting item:', error);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/menu-items/${id}/`);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Restaurant Menu Management</h1>

      <div className="mb-6 space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update Item' : 'Add Item'}
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
      <table className="w-full border border-gray-200 text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Category</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border px-4 py-2">{item.name}</td>
              <td className="border px-4 py-2">{item.category}</td>
              <td className="border px-4 py-2">₹{item.price}</td>
              <td className="border px-4 py-2 space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

