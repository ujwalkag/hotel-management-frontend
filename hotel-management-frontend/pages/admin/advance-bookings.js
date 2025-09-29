// frontend/pages/admin/advance-bookings.js - UPDATED FOR SEPARATE APP API
// Complete admin interface for the separate advance booking Django app

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

const BookingForm = ({ booking, onSubmit, onCancel, isEditing = false }) => {
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
    // Calculate remaining amount when total or advance changes
    const remaining = parseFloat(formData.total_amount || 0) - parseFloat(formData.advance_paid || 0);
    setFormData(prev => ({ ...prev, remaining_amount: Math.max(0, remaining) }));
  }, [formData.total_amount, formData.advance_paid]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.customer_phone.replace(/[^0-9]/g, ''))) {
      newErrors.customer_phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.customer_aadhar && !/^\d{12}$/.test(formData.customer_aadhar.replace(/[^0-9]/g, ''))) {
      newErrors.customer_aadhar = 'Aadhar number must be 12 digits';
    }

    if (!formData.booking_date) {
      newErrors.booking_date = 'Booking date is required';
    } else {
      const selectedDate = new Date(formData.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.booking_date = 'Booking date cannot be in the past';
      }
    }

    if (!formData.booking_time) {
      newErrors.booking_time = 'Booking time is required';
    }

    if (formData.party_size < 1 || formData.party_size > 50) {
      newErrors.party_size = 'Party size must be between 1 and 50';
    }

    if (formData.total_amount < 0) {
      newErrors.total_amount = 'Total amount cannot be negative';
    }

    if (formData.advance_paid < 0) {
      newErrors.advance_paid = 'Advance amount cannot be negative';
    }

    if (formData.advance_paid > formData.total_amount) {
      newErrors.advance_paid = 'Advance cannot be more than total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? '📝 Edit Advance Booking' : '➕ New Advance Booking'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2"
              disabled={submitting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customer_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer name"
                    disabled={submitting}
                  />
                  {errors.customer_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit phone number"
                    disabled={submitting}
                  />
                  {errors.customer_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customer_aadhar}
                    onChange={(e) => setFormData({ ...formData, customer_aadhar: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customer_aadhar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 12-digit Aadhar number"
                    disabled={submitting}
                  />
                  {errors.customer_aadhar && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_aadhar}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Size *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.party_size ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.party_size && (
                    <p className="text-red-500 text-sm mt-1">{errors.party_size}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Address (Optional)
                </label>
                <textarea
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter customer address"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Booking Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.booking_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={submitting}
                  />
                  {errors.booking_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.booking_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Time *
                  </label>
                  <input
                    type="time"
                    value={formData.booking_time}
                    onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.booking_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.booking_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.booking_time}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Notes
                </label>
                <textarea
                  value={formData.booking_notes}
                  onChange={(e) => setFormData({ ...formData, booking_notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Special requirements, dietary preferences, celebration details, etc."
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Payment Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.total_amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  {errors.total_amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.advance_paid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  {errors.advance_paid && (
                    <p className="text-red-500 text-sm mt-1">{errors.advance_paid}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remaining Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.remaining_amount}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    readOnly
                  />
                  <p className="text-sm text-gray-500 mt-1">Auto-calculated</p>
                </div>
              </div>
            </div>

            {/* Status Section (for editing) */}
            {isEditing && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h3>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  isEditing ? 'Update Booking' : 'Create Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onEdit, onDelete, onViewDetails }) => {
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = () => {
    const statusColors = {
      'confirmed': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return statusColors[booking.status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusEmoji = () => {
    const statusEmojis = {
      'confirmed': '✅',
      'pending': '⏳',
      'cancelled': '❌',
      'completed': '🎉',
    };
    return statusEmojis[booking.status] || '📅';
  };

  const isToday = () => {
    const today = new Date().toDateString();
    const bookingDate = new Date(booking.booking_date).toDateString();
    return today === bookingDate;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isToday() ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900">{booking.customer_name}</h3>
              {booking.booking_reference && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                  {booking.booking_reference}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{booking.customer_phone}</p>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
            {getStatusEmoji()} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📅</span>
            <span>
              {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
              {isToday() && <span className="ml-2 font-medium text-orange-600">(Today)</span>}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">👥</span>
            <span>{booking.party_size} people</span>
          </div>
          {booking.customer_aadhar && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">🆔</span>
              <span>Aadhar: ****-****-{booking.customer_aadhar.slice(-4)}</span>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Advance</p>
              <p className="font-semibold text-green-600">{formatCurrency(booking.advance_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className={`font-semibold ${booking.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(booking.remaining_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.booking_notes && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Notes:</p>
            <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              {booking.booking_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(booking)}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            👁️ View
          </button>
          <button
            onClick={() => onEdit(booking)}
            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(booking)}
            className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

function AdvanceBookingManagement() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the separate advance booking app API endpoint
      const response = await makeAuthenticatedRequest('/api/advance-booking/');

      if (response && response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : data.results || []);
      } else if (response && response.status === 401) {
        toast.error('Session expired. Redirecting to login...');
        localStorage.clear();
        window.location.href = '/login';
        return;
      } else {
        throw new Error('Failed to load advance bookings');
      }
    } catch (error) {
      console.error('Error loading advance bookings:', error);
      setError(error.message);
      toast.error('Failed to load advance bookings');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData) => {
    try {
      const response = await makeAuthenticatedRequest('/api/advance-booking/', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response && response.ok) {
        const newBooking = await response.json();
        setBookings(prev => [newBooking, ...prev]);
        setShowForm(false);
        toast.success('✅ Advance booking created successfully!');
      } else {
        const error = await response.json();
        toast.error(`Failed to create advance booking: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating advance booking:', error);
      toast.error('Network error while creating advance booking');
    }
  };

  const updateBooking = async (bookingData) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/advance-booking/${editingBooking.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(bookingData)
      });

      if (response && response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => prev.map(booking =>
          booking.id === editingBooking.id ? updatedBooking : booking
        ));
        setShowForm(false);
        setEditingBooking(null);
        toast.success('✅ Advance booking updated successfully!');
      } else {
        const error = await response.json();
        toast.error(`Failed to update advance booking: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating advance booking:', error);
      toast.error('Network error while updating advance booking');
    }
  };

  const deleteBooking = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/api/advance-booking/${deletingBooking.id}/`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        setBookings(prev => prev.filter(booking => booking.id !== deletingBooking.id));
        setShowDeleteModal(false);
        setDeletingBooking(null);
        toast.success('✅ Advance booking deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(`Failed to delete advance booking: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting advance booking:', error);
      toast.error('Network error while deleting advance booking');
    }
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_phone.includes(searchQuery) ||
        (booking.customer_aadhar && booking.customer_aadhar.includes(searchQuery)) ||
        (booking.booking_reference && booking.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter(booking => booking.booking_date === filterDate);
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending_payment') {
        filtered = filtered.filter(booking => booking.remaining_amount > 0);
      } else {
        filtered = filtered.filter(booking => booking.status === filterStatus);
      }
    }

    // Sort by booking date (ascending)
    return filtered.sort((a, b) => new Date(`${a.booking_date}T${a.booking_time}`) - new Date(`${b.booking_date}T${b.booking_time}`));
  };

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading advance bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📅 Advance Booking Management</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🏠 Dashboard
              </Link>

              <Link
                href="/admin/table-management"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🏪 Tables
              </Link>

              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ➕ New Advance Booking
              </button>

              <button
                onClick={loadBookings}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">⚠️</span>
              <div>
                <h3 className="text-red-800 font-semibold">Error loading advance bookings</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={loadBookings}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  🔄 Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔥</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-blue-900">
                  {bookings.filter(booking => {
                    const today = new Date().toDateString();
                    const bookingDate = new Date(booking.booking_date).toDateString();
                    return today === bookingDate;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏳</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.remaining_amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by name, phone, Aadhar, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending_payment">Pending Payment</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterDate('');
                  setFilterStatus('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        {getFilteredBookings().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No advance bookings found</h2>
            <p className="text-gray-600 mb-6">
              {bookings.length === 0 
                ? "No advance bookings have been created yet."
                : "No advance bookings match your current filters."
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              ➕ Create First Advance Booking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredBookings().map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onEdit={(booking) => {
                  setEditingBooking(booking);
                  setShowForm(true);
                }}
                onDelete={(booking) => {
                  setDeletingBooking(booking);
                  setShowDeleteModal(true);
                }}
                onViewDetails={setSelectedBooking}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <BookingForm
          booking={editingBooking}
          isEditing={!!editingBooking}
          onSubmit={editingBooking ? updateBooking : createBooking}
          onCancel={() => {
            setShowForm(false);
            setEditingBooking(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Advance Booking</h2>

            <div className="mb-4">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">⚠️</span>
                <p>Are you sure you want to delete the advance booking for <strong>{deletingBooking.customer_name}</strong>?</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Reference:</strong> {deletingBooking.booking_reference}</p>
                <p><strong>Date:</strong> {new Date(deletingBooking.booking_date).toLocaleDateString('en-IN')}</p>
                <p><strong>Time:</strong> {new Date(`2000-01-01T${deletingBooking.booking_time}`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                <p><strong>Party Size:</strong> {deletingBooking.party_size} people</p>
                <p><strong>Total Amount:</strong> {formatCurrency(deletingBooking.total_amount)}</p>
              </div>

              <p className="text-sm text-red-600 mt-3">
                This action cannot be undone. The advance booking will be permanently removed.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingBooking(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteBooking}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Advance Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Reference */}
                {selectedBooking.booking_reference && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-blue-900">Booking Reference</h3>
                      <p className="text-2xl font-mono font-bold text-blue-700 mt-1">
                        {selectedBooking.booking_reference}
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                      <p className="text-lg">{selectedBooking.customer_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="text-lg">{selectedBooking.customer_phone}</p>
                    </div>
                    {selectedBooking.customer_aadhar && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                        <p className="text-lg font-mono">{selectedBooking.customer_aadhar}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Party Size</label>
                      <p className="text-lg">{selectedBooking.party_size} people</p>
                    </div>
                  </div>

                  {selectedBooking.customer_address && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-lg">{selectedBooking.customer_address}</p>
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Booking Date</label>
                      <p className="text-lg">{new Date(selectedBooking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Booking Time</label>
                      <p className="text-lg">{new Date(`2000-01-01T${selectedBooking.booking_time}`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="text-lg capitalize">{selectedBooking.status}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedBooking.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Advance Paid</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(selectedBooking.advance_paid)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className={`text-lg font-bold ${selectedBooking.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedBooking.remaining_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.booking_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking Notes</label>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p>{selectedBooking.booking_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setEditingBooking(selectedBooking);
                    setShowForm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(AdvanceBookingManagement, ['admin']);
