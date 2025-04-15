// pages/admin/restaurant-billing.js

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function RestaurantBilling() {
  const [menuItems, setMenuItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [guests, setGuests] = useState([])
  const [selectedGuest, setSelectedGuest] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch menu and guest list
  useEffect(() => {
    fetchMenu()
    fetchGuests()
  }, [])

  const fetchMenu = async () => {
    try {
      const res = await axios.get('/api/restaurant/menu-items/')
      setMenuItems(res.data)
    } catch (err) {
      toast.error('Failed to load menu items')
    }
  }

  const fetchGuests = async () => {
    try {
      const res = await axios.get('/api/guests/')
      setGuests(res.data)
    } catch (err) {
      toast.error('Failed to load guests')
    }
  }

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(prev =>
      prev.some(i => i.item === itemId)
        ? prev.map(i =>
            i.item === itemId ? { ...i, quantity: parseInt(quantity) } : i
          )
        : [...prev, { item: itemId, quantity: parseInt(quantity) }]
    )
  }

  const totalPrice = selectedItems.reduce((total, curr) => {
    const item = menuItems.find(i => i.id === curr.item)
    return total + (item?.price || 0) * curr.quantity
  }, 0)

  const handleSubmit = async () => {
    if (!selectedGuest || selectedItems.length === 0) {
      return toast.error('Please select guest and at least one item')
    }

    setLoading(true)
    try {
      await axios.post('/api/restaurant-billing/', {
        guest: selectedGuest,
        items: selectedItems,
      })
      toast.success('Restaurant bill submitted!')
      setSelectedItems([])
      setSelectedGuest('')
    } catch (err) {
      toast.error('Error submitting restaurant bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Restaurant Billing</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Select Guest</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedGuest}
          onChange={e => setSelectedGuest(e.target.value)}
        >
          <option value="">Select Guest</option>
          {guests.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="font-semibold text-lg mb-2">Menu Items</h2>
      {menuItems.map(item => (
        <div key={item.id} className="flex justify-between items-center mb-2">
          <div>{item.name} - ₹{item.price}</div>
          <input
            type="number"
            min="0"
            placeholder="Qty"
            className="w-20 p-1 border rounded"
            onChange={e => handleQuantityChange(item.id, e.target.value)}
          />
        </div>
      ))}

      <div className="mt-4 font-semibold">
        Total Price: ₹{totalPrice.toFixed(2)}
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Bill'}
      </button>
    </div>
  )
}

