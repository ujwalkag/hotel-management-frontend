// pages/admin/advance-bookings.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";

const BookingForm = ({ booking, onSubmit, onCancel, isEditing = false }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_aadhar: '',
    customer_address: '',
    booking_date: '',
    booking_time: '',
    party_size: 2,
    booking_notes: '',
    total_amount: 0,
    advance_paid: 0,
    remaining_amount: 0,
    status: 'confirmed',
    ...booking
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const remaining = parseFloat(formData.total_amount || 0) - parseFloat(formData.advance_paid || 0);
    setFormData(prev => ({ ...prev, remaining_amount: Math.max(0, remaining) }));
  }, [formData.total_amount, formData.advance_paid]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = language === "hi"
        ? 'ग्राहक का नाम आवश्यक है'
        : 'Customer name is required';
    }
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = language === "hi"
        ? 'फ़ोन नंबर आवश्यक है'
        : 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.customer_phone.replace(/[^0-9]/g, ''))) {
      newErrors.customer_phone = language === "hi"
        ? 'कृपया 10 अंकों का वैध फ़ोन नंबर दर्ज करें'
        : 'Please enter a valid 10-digit phone number';
    }
    if (formData.customer_aadhar && !/^\d{12}$/.test(formData.customer_aadhar.replace(/[^0-9]/g, ''))) {
      newErrors.customer_aadhar = language === "hi"
        ? 'आधार नंबर 12 अंकों का होना चाहिए'
        : 'Aadhar number must be 12 digits';
    }
    if (!formData.booking_date) {
      newErrors.booking_date = language === "hi"
        ? 'बुकिंग की तारीख आवश्यक है'
        : 'Booking date is required';
    } else {
      const sel = new Date(formData.booking_date);
      const today = new Date(); today.setHours(0,0,0,0);
      if (sel < today) {
        newErrors.booking_date = language==="hi"
          ? 'बुकिंग की तारीख भूतकाल में नहीं हो सकती'
          : 'Booking date cannot be in the past';
      }
    }
    if (!formData.booking_time) {
      newErrors.booking_time = language === "hi"
        ? 'बुकिंग का समय आवश्यक है'
        : 'Booking time is required';
    }
    if (formData.party_size < 1 || formData.party_size > 50) {
      newErrors.party_size = language==="hi"
        ? 'पार्टी का आकार 1 से 50 के बीच होना चाहिए'
        : 'Party size must be between 1 and 50';
    }
    if (formData.total_amount < 0) {
      newErrors.total_amount = language==="hi"
        ? 'कुल राशि नकारात्मक नहीं हो सकती'
        : 'Total amount cannot be negative';
    }
    if (formData.advance_paid < 0) {
      newErrors.advance_paid = language==="hi"
        ? 'एडवांस राशि नकारात्मक नहीं हो सकती'
        : 'Advance amount cannot be negative';
    }
    if (formData.advance_paid > formData.total_amount) {
      newErrors.advance_paid = language==="hi"
        ? 'एडवांस कुल राशि से अधिक नहीं हो सकती'
        : 'Advance cannot be more than total amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length===0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try { await onSubmit(formData); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isEditing
                ? (language==="hi"?"📝 एडवांस बुकिंग संपादित करें":"📝 Edit Advance Booking")
                : (language==="hi"?"➕ नई एडवांस बुकिंग":"➕ New Advance Booking")}
            </h2>
            <button onClick={onCancel} disabled={submitting}
              className="text-gray-400 hover:text-gray-600 p-2">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {language==="hi"?"ग्राहक की जानकारी":"Customer Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"ग्राहक का नाम *":"Customer Name *"}
                  </label>
                  <input type="text" value={formData.customer_name}
                    onChange={e=>setFormData({...formData,customer_name:e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_name?'border-red-500':'border-gray-300'}`}
                    placeholder={language==="hi"?"ग्राहक का पूरा नाम दर्ज करें":"Enter customer's full name"}
                    disabled={submitting} dir="auto"/>
                  {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"फ़ोन नंबर *":"Phone Number *"}
                  </label>
                  <input type="tel" value={formData.customer_phone}
                    onChange={e=>setFormData({...formData,customer_phone:e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_phone?'border-red-500':'border-gray-300'}`}
                    placeholder={language==="hi"?"10 अंकों का फ़ोन नंबर":"10-digit phone number"}
                    disabled={submitting}/>
                  {errors.customer_phone && <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"आधार नंबर (वैकल्पिक)":"Aadhar Number (Optional)"}
                  </label>
                  <input type="text" value={formData.customer_aadhar}
                    onChange={e=>setFormData({...formData,customer_aadhar:e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_aadhar?'border-red-500':'border-gray-300'}`}
                    placeholder={language==="hi"?"12 अंकों का आधार नंबर":"12-digit Aadhar number"}
                    disabled={submitting}/>
                  {errors.customer_aadhar && <p className="text-red-500 text-sm mt-1">{errors.customer_aadhar}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"पार्टी का आकार *":"Party Size *"}
                  </label>
                  <input type="number" min="1" max="50" value={formData.party_size}
                    onChange={e=>setFormData({...formData,party_size:parseInt(e.target.value)||1})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.party_size?'border-red-500':'border-gray-300'}`}
                    disabled={submitting}/>
                  {errors.party_size && <p className="text-red-500 text-sm mt-1">{errors.party_size}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  {language==="hi"?"ग्राहक का पता (वैकल्पिक)":"Customer Address (Optional)"}
                </label>
                <textarea value={formData.customer_address}
                  onChange={e=>setFormData({...formData,customer_address:e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder={language==="hi"?"ग्राहक का पूरा पता दर्ज करें":"Enter customer's complete address"}
                  disabled={submitting} dir="auto"/>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {language==="hi"?"बुकिंग विवरण":"Booking Details"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"बुकिंग की तारीख *":"Booking Date *"}
                  </label>
                  <input type="date" value={formData.booking_date}
                    onChange={e=>setFormData({...formData,booking_date:e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.booking_date?'border-red-500':'border-gray-300'}`}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={submitting}/>
                  {errors.booking_date && <p className="text-red-500 text-sm mt-1">{errors.booking_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"बुकिंग का समय *":"Booking Time *"}
                  </label>
                  <input type="time" value={formData.booking_time}
                    onChange={e=>setFormData({...formData,booking_time:e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.booking_time?'border-red-500':'border-gray-300'}`}
                    disabled={submitting}/>
                  {errors.booking_time && <p className="text-red-500 text-sm mt-1">{errors.booking_time}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  {language==="hi"?"विशेष टिप्पणी":"Special Notes"}
                </label>
                <textarea value={formData.booking_notes}
                  onChange={e=>setFormData({...formData,booking_notes:e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder={language==="hi"?"विशेष आवश्यकताएं, आहार की प्राथमिकताएं, उत्सव का विवरण आदि":"Special requirements, dietary preferences, celebration details, etc."}
                  disabled={submitting} dir="auto"/>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {language==="hi"?"भुगतान की जानकारी":"Payment Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"कुल राशि (₹)":"Total Amount (₹)"}
                  </label>
                  <input type="number" min="0" step="0.01" value={formData.total_amount}
                    onChange={e=>setFormData({...formData,total_amount:parseFloat(e.target.value)||0})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" disabled={submitting}/>
                  {errors.total_amount && <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"एडवांस भुगतान (₹)":"Advance Paid (₹)"}
                  </label>
                  <input type="number" min="0" step="0.01" value={formData.advance_paid}
                    onChange={e=>setFormData({...formData,advance_paid:parseFloat(e.target.value)||0})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" disabled={submitting}/>
                  {errors.advance_paid && <p className="text-red-500 text-sm mt-1">{errors.advance_paid}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language==="hi"?"शेष राशि (₹)":"Remaining Amount (₹)"}
                  </label>
                  <input type="number" value={formData.remaining_amount}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    readOnly/>
                  <p className="text-xs text-gray-500 mt-1">
                    {language==="hi"?"स्वचालित गणना":"Auto-calculated"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status (if editing) */}
            {isEditing && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {language==="hi"?"बुकिंग स्थिति":"Booking Status"}
                </h3>
                <select value={formData.status}
                  onChange={e=>setFormData({...formData,status:e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}>
                  <option value="confirmed">{language==="hi"?"पुष्ट":"Confirmed"}</option>
                  <option value="pending">{language==="hi"?"लंबित":"Pending"}</option>
                  <option value="cancelled">{language==="hi"?"रद्द":"Cancelled"}</option>
                  <option value="completed">{language==="hi"?"पूर्ण":"Completed"}</option>
                </select>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button type="button" onClick={onCancel}
                className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}>
                {language==="hi"?"रद्द करें":"Cancel"}
              </button>
              <button type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}>
                {submitting
                  ? (language==="hi"?"सहेजा जा रहा है...":"Saving...")
                  : isEditing
                    ? (language==="hi"?"अपडेट करें":"Update Booking")
                    : (language==="hi"?"बुकिंग बनाएं":"Create Booking")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onEdit, onDelete, onViewDetails }) => {
  const { language } = useLanguage();
  const formatCurrency = amt => `₹${parseFloat(amt||0).toLocaleString('en-IN')}`;
  const formatDate = dateString =>
    new Date(dateString).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const formatTime = timeString =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit', hour12:true });
  const getStatusColor = status => ({
    confirmed:'bg-green-100 text-green-800', pending:'bg-yellow-100 text-yellow-800',
    cancelled:'bg-red-100 text-red-800', completed:'bg-blue-100 text-blue-800'
  }[status]||'bg-gray-100 text-gray-800');
  const getStatusEmoji = status => ({
    confirmed:'✅', pending:'⏳', cancelled:'❌', completed:'🎉'
  }[status]||'📅');
  const isToday = () => new Date().toDateString() === new Date(booking.booking_date).toDateString();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{booking.customer_name}</h3>
          <p className="text-sm text-gray-600">{booking.customer_phone}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {getStatusEmoji(booking.status)} {language==="hi"
            ? booking.status.charAt(0).toUpperCase()+booking.status.slice(1)
            : booking.status.charAt(0).toUpperCase()+booking.status.slice(1)}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>📅 {formatDate(booking.booking_date)} {isToday()&& (language==="hi"?"(आज)":"(Today)")}</p>
        <p>⏰ {formatTime(booking.booking_time)}</p>
        <p>👥 {booking.party_size} {language==="hi"?"लोग":"people"}</p>
        {booking.customer_aadhar && (
          <p>🆔 Aadhar: ****-****-{booking.customer_aadhar.slice(-4)}</p>
        )}
        <p>💰 {language==="hi"?"कुल राशि":"Total"}: {formatCurrency(booking.total_amount)}</p>
        <p>💸 {language==="hi"?"एडवांस":"Advance"}: {formatCurrency(booking.advance_paid)}</p>
        <p>⏳ {language==="hi"?"शेष":"Remaining"}: {formatCurrency(booking.remaining_amount)}</p>
        {booking.booking_notes && (
          <p>📝 {booking.booking_notes}</p>
        )}
      </div>
      <div className="flex justify-end space-x-2 mt-2">
        <button onClick={()=>onEdit(booking)} className="px-3 py-1 bg-blue-600 text-white rounded">{language==="hi"?"संपादित करें":"Edit"}</button>
        <button onClick={()=>onDelete(booking)} className="px-3 py-1 bg-red-600 text-white rounded">{language==="hi"?"हटाएं":"Delete"}</button>
      </div>
    </div>
  );
};

function AdvanceBookingManagement() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    setLoading(true); setError(null);
    try {
      const res = await makeAuthenticatedRequest('/api/advance-booking/');
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data)?data:data.results||[]);
      } else throw new Error();
    } catch (e) {
      setError(language==="hi"?'एडवांस बुकिंग लोड नहीं हो सकी':'Failed to load advance bookings');
      toast.error(language==="hi"?'एडवांस बुकिंग लोड नहीं हो सकी':'Failed to load advance bookings');
    } finally { setLoading(false); }
  };

  const createBooking = async b => {
    const res = await makeAuthenticatedRequest('/api/advance-booking/', {
      method:'POST', body:JSON.stringify(b)
    });
    if (res.ok) { const nb=await res.json(); setBookings(prev=>[nb,...prev]); toast.success(language==="hi"?'✅ एडवांस बुकिंग सफलतापूर्वक बनाई गई!':'✅ Advance booking created successfully!'); setShowForm(false);}
    else toast.error(language==="hi"?'एडवांस बुकिंग नहीं बनाई':'Failed to create advance booking');
  };

  const updateBooking = async b => {
    const res = await makeAuthenticatedRequest(`/api/advance-booking/${editingBooking.id}/`, {
      method:'PATCH', body:JSON.stringify(b)
    });
    if (res.ok) { const ub=await res.json(); setBookings(prev=>prev.map(x=>x.id===ub.id?ub:x)); toast.success(language==="hi"?'✅ एडवांस बुकिंग सफलतापूर्वक अपडेट की गई!':'✅ Advance booking updated successfully!'); setShowForm(false); setEditingBooking(null);}
    else toast.error(language==="hi"?'एडवांस बुकिंग अपडेट नहीं हुई':'Failed to update advance booking');
  };

  const deleteBooking = async booking => {
    const res = await makeAuthenticatedRequest(`/api/advance-booking/${booking.id}/`, { method:'DELETE' });
    if (res.ok) { setBookings(prev=>prev.filter(x=>x.id!==booking.id)); toast.success(language==="hi"?'✅ एडवांस बुकिंग सफलतापूर्वक हटाई गई!':'✅ Advance booking deleted successfully!'); }
    else toast.error(language==="hi"?'एडवांस बुकिंग हटाई नहीं जा सकी':'Failed to delete advance booking');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      <p className="ml-4 text-gray-600">{language==="hi"?'लोड हो रहा है...':'Loading advance bookings...'}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📅 {language==="hi"?'एडवांस बुकिंग प्रबंधन':'Advance Booking Management'}</h1>
        <div className="space-x-2">
          <Link href="/admin/dashboard" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{language==="hi"?'🏠 डैशबोर्ड':'🏠 Dashboard'}</Link>
          <Link href="/admin/table-management" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{language==="hi"?'🏪 टेबल':'🏪 Tables'}</Link>
          <button onClick={()=>{setShowForm(true);setEditingBooking(null);}} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">➕ {language==="hi"?'नई बुकिंग':'New Advance Booking'}</button>
          <button onClick={loadBookings} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">🔄 {language==="hi"?'रीफ्रेश':'Refresh'}</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-3 border">
          <span className="text-3xl">📅</span>
          <div>
            <p className="text-sm text-gray-600">{language==="hi"?'कुल बुकिंग':'Total Bookings'}</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-3 border">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm text-gray-600">{language==="hi"?'आज की बुकिंग': "Today's Bookings"}</p>
            <p className="text-2xl font-bold">{bookings.filter(b=>new Date(b.booking_date).toDateString()===new Date().toDateString()).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-3 border">
          <span className="text-3xl">💰</span>
          <div>
            <p className="text-sm text-gray-600">{language==="hi"?'कुल राजस्व':'Total Revenue'}</p>
            <p className="text-2xl font-bold">{`₹${bookings.reduce((s,b)=>s+(b.total_amount||0),0).toLocaleString('en-IN')}`}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-3 border">
          <span className="text-3xl">⏳</span>
          <div>
            <p className="text-sm text-gray-600">{language==="hi"?'लंबित भुगतान':'Pending Payment'}</p>
            <p className="text-2xl font-bold">{`₹${bookings.reduce((s,b)=>s+(b.remaining_amount||0),0).toLocaleString('en-IN')}`}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text"
            placeholder={language==="hi"?'नाम, फ़ोन, आधार या रेफरेंस खोजें...':'Search by name, phone, Aadhar, or reference...'}
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            className="w-full border rounded px-3 py-2" dir="auto"/>
          <input type="date" value={filterDate}
            onChange={e=>setFilterDate(e.target.value)}
            className="w-full border rounded px-3 py-2"/>
          <select value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value)}
            className="w-full border rounded px-3 py-2">
            <option value="all">{language==="hi"?'सभी बुकिंग':'All Bookings'}</option>
            <option value="confirmed">{language==="hi"?'पुष्ट':'Confirmed'}</option>
            <option value="pending">{language==="hi"?'लंबित':'Pending'}</option>
            <option value="completed">{language==="hi"?'पूर्ण':'Completed'}</option>
            <option value="cancelled">{language==="hi"?'रद्द':'Cancelled'}</option>
            <option value="pending_payment">{language==="hi"?'लंबित भुगतान':'Pending Payment'}</option>
          </select>
          <button onClick={()=>{setSearchQuery('');setFilterDate('');setFilterStatus('all');}}
            className="w-full px-4 py-2 border rounded text-gray-700">
            {language==="hi"?'फिल्टर साफ़ करें':'Clear Filters'}
          </button>
        </div>
      </div>

      {/* Booking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.length===0
          ? <p>{language==="hi"?'कोई एडवांस बुकिंग नहीं मिली':'No advance bookings found'}</p>
          : bookings.filter(b=>filterStatus==='all'||b.status===filterStatus)
            .map(b=>(
              <BookingCard
                key={b.id}
                booking={b}
                onEdit={b=>{setEditingBooking(b);setShowForm(true)}}
                onDelete={deleteBooking}
              />
            ))
        }
      </div>

      {/* Form Modal */}
      {showForm && (
        <BookingForm
          booking={editingBooking}
          onSubmit={editingBooking?updateBooking:createBooking}
          onCancel={()=>{setShowForm(false);setEditingBooking(null)}}
          isEditing={!!editingBooking}
        />
      )}
    </div>
  );
}

export default withRoleGuard(AdvanceBookingManagement, ['admin']);


