import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoomBilling = () => {
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState('');
  const [room, setRoom] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [price, setPrice] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false);

  useEffect(() => {
    axios.get('/api/guests/')
      .then(res => setGuests(res.data))
      .catch(err => console.error('Error fetching guests:', err));
  }, []);

  useEffect(() => {
    if (checkIn && checkOut) {
      const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
      const total = days > 0 ? days * 1000 : 0; // Assuming ₹1000 per day
      setPrice(total);
    }
  }, [checkIn, checkOut]);

  const handleBilling = async () => {
    try {
      await axios.post('/api/room-billings/', {
        guest: selectedGuest,
        room,
        check_in: checkIn,
        check_out: checkOut,
        total_price: price,
      });
      setBillGenerated(true);
    } catch (err) {
      console.error('Billing failed:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Room Billing</h2>
      <select onChange={e => setSelectedGuest(e.target.value)} className="border p-2 mb-2 w-full">
        <option value="">Select Guest</option>
        {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <input type="text" placeholder="Room No." onChange={e => setRoom(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="date" onChange={e => setCheckIn(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="date" onChange={e => setCheckOut(e.target.value)} className="border p-2 mb-2 w-full" />
      <div className="mb-2">Total Price: ₹{price}</div>
      <button onClick={handleBilling} className="bg-green-600 text-white px-4 py-2 rounded">
        Generate Bill
      </button>
      {billGenerated && <p className="mt-2 text-green-700">Bill generated successfully!</p>}
    </div>
  );
};

export default RoomBilling;

