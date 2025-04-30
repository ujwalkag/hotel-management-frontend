
i// pages/admin/rooms.js
import { useEffect, useState } from 'react';
import axios from '@/utils/axiosInstance';
import withRoleGuard from '@/utils/withRoleGuard';

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_number: '', room_type: '', price_per_night: '' });
  const [editingRoomId, setEditingRoomId] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/rooms/');
      if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        console.error('Expected rooms array but got:', res.data);
        setRooms([]);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingRoomId) {
        await axios.put(`/rooms/${editingRoomId}/`, form);
      } else {
        await axios.post('/rooms/', form);
      }
      setForm({ room_number: '', room_type: '', price_per_night: '' });
      setEditingRoomId(null);
      fetchRooms();
    } catch (err) {
      console.error('Error saving room:', err);
    }
  };

  const handleEdit = (room) => {
    setForm({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night,
    });
    setEditingRoomId(room.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/rooms/${id}/`);
      fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Room Management</h1>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          name="room_number"
          placeholder="Room Number"
          value={form.room_number}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="room_type"
          placeholder="Room Type"
          value={form.room_type}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="price_per_night"
          placeholder="Price per Night"
          value={form.price_per_night}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingRoomId ? 'Update Room' : 'Add Room'}
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Rooms</h2>
      <table className="w-full border text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Room #</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(rooms) && rooms.length > 0 ? (
            rooms.map((room) => (
              <tr key={room.id}>
                <td className="border px-4 py-2">{room.room_number}</td>
                <td className="border px-4 py-2">{room.room_type}</td>
                <td className="border px-4 py-2">₹{room.price_per_night}</td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">
                No rooms available or failed to load.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default withRoleGuard(AdminRooms, ['admin']);

