import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from '@/utils/axiosInstance';
import withRoleGuard from '@/utils/withRoleGuard';

function RoomOrders() {
  const router = useRouter();
  const [roomServices, setRoomServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/room-services/');
      setRoomServices(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleCheckboxChange = (service) => {
    const exists = selectedServices.find(s => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, value) => {
    const updated = selectedServices.map(s =>
      s.id === id ? { ...s, quantity: parseInt(value) || 1 } : s
    );
    setSelectedServices(updated);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/room-orders/', {
        guest_name: guestName,
        room_number: roomNumber,
        services: selectedServices,
      });
      alert('Room order created!');
      setSelectedServices([]);
      setGuestName('');
      setRoomNumber('');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Room Service Order</h1>

      <input
        type="text"
        placeholder="Guest Name"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        className="border p-2 mb-2 w-full"
      />

      <input
        type="text"
        placeholder="Room Number"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <h2 className="text-xl font-semibold mb-2">Select Services</h2>
      <div className="grid grid-cols-2 gap-3">
        {roomServices.map(service => (
          <div key={service.id} className="border p-2 rounded flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedServices.some(s => s.id === service.id)}
              onChange={() => handleCheckboxChange(service)}
            />
            <label className="flex-1">{service.name} (₹{service.price})</label>
            {selectedServices.some(s => s.id === service.id) && (
              <input
                type="number"
                min="1"
                className="w-16 border p-1"
                value={selectedServices.find(s => s.id === service.id)?.quantity || 1}
                onChange={(e) => handleQuantityChange(service.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit Order
      </button>
    </div>
  );
}

export default withRoleGuard(RoomOrders, ['admin']);

