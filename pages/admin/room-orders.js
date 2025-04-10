import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function RoomOrders() {
  const router = useRouter();
  const [roomServices, setRoomServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [daysStayed, setDaysStayed] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch room services from backend
  useEffect(() => {
    axios.get('/api/room-services/')
      .then(res => setRoomServices(res.data))
      .catch(err => console.error('Failed to fetch room services', err));
  }, []);

  // Update price when selection changes
  useEffect(() => {
    const serviceTotal = selectedServices.reduce((acc, id) => {
      const service = roomServices.find(item => item.id === id);
      return acc + (service ? service.price : 0);
    }, 0);
    setTotalPrice(serviceTotal * daysStayed);
  }, [selectedServices, daysStayed, roomServices]);

  const handleServiceToggle = (id) => {
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/room-orders/', {
        room_number: roomNumber,
        days_stayed: daysStayed,
        services: selectedServices
      });
      alert('Room order created successfully!');
      // Reset form
      setRoomNumber('');
      setDaysStayed(1);
      setSelectedServices([]);
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Failed to create room order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Room Order Billing</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block font-medium">Room Number</label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="border p-2 w-full rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Days Stayed</label>
          <input
            type="number"
            min="1"
            value={daysStayed}
            onChange={(e) => setDaysStayed(parseInt(e.target.value) || 1)}
            className="border p-2 w-full rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Select Services</label>
          <div className="grid grid-cols-2 gap-2">
            {roomServices.map(service => (
              <label key={service.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                />
                <span>{service.name} (₹{service.price})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="text-lg font-semibold">
          Total Price: ₹{totalPrice}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {submitting ? 'Submitting...' : 'Submit Room Order'}
        </button>
      </form>
    </div>
  );
}

