import React, { useState, useEffect } from 'react';
import axios from 'axios';
import withRoleGuard from '@/utils/withRoleGuard';

const RoomBilling = () => {
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [guest, setGuest] = useState('');
  const [roomId, setRoomId] = useState('');
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get('/api/rooms/')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err));

    axios.get('/api/room-services/')
      .then(res => setServices(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const sum = selectedServices.reduce((acc, item) => acc + item.price, 0);
    setTotal(sum);
  }, [selectedServices]);

  const toggleService = (service) => {
    const exists = selectedServices.find(i => i.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter(i => i.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const generateBill = async () => {
    try {
      await axios.post('/api/room-billings/', {
        guest,
        room: roomId,
        services: selectedServices.map(s => s.id),
        total_price: total,
      });
      setSuccess(true);
      setGuest('');
      setRoomId('');
      setSelectedServices([]);
    } catch (error) {
      console.error('Error generating room bill:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Room Billing</h2>

      <input
        type="text"
        placeholder="Guest Name"
        value={guest}
        onChange={(e) => setGuest(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border p-2 mb-4 w-full"
      >
        <option value="">Select Room</option>
        {rooms.map(room => (
          <option key={room.id} value={room.id}>
            Room {room.room_number} - ₹{room.price_per_night}
          </option>
        ))}
      </select>

      <h3 className="font-semibold mb-2">Select Services:</h3>
      <div className="mb-4">
        {services.map(service => (
          <label key={service.id} className="block">
            <input
              type="checkbox"
              checked={!!selectedServices.find(i => i.id === service.id)}
              onChange={() => toggleService(service)}
            /> {service.name} - ₹{service.price}
          </label>
        ))}
      </div>

      <div className="mb-2 font-semibold">Total: ₹{total}</div>

      <button onClick={generateBill} className="bg-blue-600 text-white px-4 py-2 rounded">
        Generate Room Bill
      </button>

      {success && <p className="mt-2 text-green-600">Room bill generated successfully!</p>}
    </div>
  );
};

// ✅ Correct component passed here
export default withRoleGuard(RoomBilling, ['admin', 'staff']);

