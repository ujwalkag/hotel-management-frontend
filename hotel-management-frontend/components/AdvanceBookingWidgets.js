// frontend/components/AdvanceBookingWidgets.js - UPDATED FOR SEPARATE APP
// Dashboard widgets that consume the separate advance booking app API

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// ADMIN ADVANCE BOOKING WIDGET - Full management access
export const AdminAdvanceBookingWidget = () => {
  const [bookingStats, setBookingStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    loadBookingStats();
  }, []);

  const loadBookingStats = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/advance-booking/dashboard-stats/');
      if (response && response.ok) {
        const data = await response.json();
        setBookingStats(data);
      }
    } catch (error) {
      console.error('Error loading advance booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bookingStats.today_bookings_count && !bookingStats.pending_payments_count) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📅 Advance Booking Overview</h3>
        <Link
          href="/admin/advance-bookings"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Manage All →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {bookingStats.today_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">Today's Bookings</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {bookingStats.tomorrow_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">Tomorrow</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {bookingStats.week_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {bookingStats.pending_payments_count || 0}
          </div>
          <div className="text-sm text-gray-600">Pending Payments</div>
        </div>
      </div>

      {/* Today's Bookings List */}
      {bookingStats.today_bookings && bookingStats.today_bookings.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="font-medium text-gray-700 flex items-center">
            <span className="mr-2">📋</span>
            Today's Schedule ({bookingStats.today_bookings.length}):
          </h4>
          {bookingStats.today_bookings.map((booking, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{booking.customer_name}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {booking.party_size} people
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {booking.customer_phone}
                  {booking.booking_reference && (
                    <span className="ml-2 text-gray-500">• {booking.booking_reference}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-700 text-lg">
                  {booking.booking_time_formatted || booking.booking_time.slice(0, 5)}
                </div>
                {booking.remaining_amount > 0 && (
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    ₹{booking.remaining_amount} pending
                  </div>
                )}
                {booking.booking_notes && (
                  <div className="text-xs text-gray-500 mt-1">Has special notes</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Payments Alert */}
      {bookingStats.pending_payments_count > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800 font-medium">
                {bookingStats.pending_payments_count} bookings with pending payments
              </span>
            </div>
            <div className="font-bold text-red-900">
              {formatCurrency(bookingStats.pending_payments_amount)}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats for Admin */}
      {bookingStats.total_bookings && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
            <div>
              <span className="font-medium">{bookingStats.total_bookings}</span> Total Bookings
            </div>
            <div>
              <span className="font-medium">{formatCurrency(bookingStats.total_revenue)}</span> Total Revenue
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// STAFF ADVANCE BOOKING WIDGET - Read-only information
export const StaffAdvanceBookingWidget = () => {
  const [bookingStats, setBookingStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    loadBookingStats();
  }, []);

  const loadBookingStats = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/advance-booking/dashboard-stats/');
      if (response && response.ok) {
        const data = await response.json();
        setBookingStats(data);
      }
    } catch (error) {
      console.error('Error loading advance booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bookingStats.today_bookings_count && !bookingStats.tomorrow_bookings_count) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Advance Booking Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {bookingStats.today_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">Today's Bookings</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {bookingStats.tomorrow_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">Tomorrow</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {bookingStats.week_bookings_count || 0}
          </div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
      </div>

      {/* Today's Schedule for Staff */}
      {bookingStats.today_bookings && bookingStats.today_bookings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">📋 Today's Schedule:</h4>
          {bookingStats.today_bookings.slice(0, 5).map((booking, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
              <div>
                <span className="font-medium text-gray-900">{booking.customer_name}</span>
                <span className="text-sm text-gray-600 ml-2">({booking.party_size} people)</span>
              </div>
              <div className="text-sm font-medium text-blue-700">
                {booking.booking_time_formatted || booking.booking_time.slice(0, 5)}
              </div>
            </div>
          ))}
          {bookingStats.today_bookings.length > 5 && (
            <p className="text-sm text-gray-500 text-center">
              +{bookingStats.today_bookings.length - 5} more bookings
            </p>
          )}
        </div>
      )}

      {/* Pending Payments Info for Staff */}
      {bookingStats.pending_payments_count > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <span className="font-medium">{bookingStats.pending_payments_count}</span> bookings have pending payments
          </div>
        </div>
      )}
    </div>
  );
};

// WAITER ADVANCE BOOKING WIDGET - Essential service information
export const WaiterAdvanceBookingWidget = () => {
  const [todayBookings, setTodayBookings] = useState([]);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    loadBookingInfo();
  }, []);

  const loadBookingInfo = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/advance-booking/dashboard-stats/');
      if (response && response.ok) {
        const data = await response.json();
        setTodayBookings(data.today_bookings || []);
        setTomorrowCount(data.tomorrow_bookings_count || 0);
      }
    } catch (error) {
      console.error('Error loading advance booking info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (todayBookings.length === 0 && tomorrowCount === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">🍽️ Today's Advance Bookings</h3>
        {tomorrowCount > 0 && (
          <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            <span className="font-medium">{tomorrowCount}</span> tomorrow
          </div>
        )}
      </div>
      
      {todayBookings.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {todayBookings.length} advance booking{todayBookings.length > 1 ? 's' : ''} scheduled today:
          </div>
          {todayBookings.map((booking, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{booking.customer_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span>Party of {booking.party_size}</span>
                  <span className="mx-1">•</span>
                  <span>{booking.customer_phone}</span>
                  {booking.booking_reference && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-gray-500">{booking.booking_reference}</span>
                    </>
                  )}
                </div>
                {booking.booking_notes && (
                  <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                    📝 Special notes available
                  </div>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-xl font-bold text-orange-600">
                  {booking.booking_time_formatted || booking.booking_time.slice(0, 5)}
                </div>
                {booking.remaining_amount > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    Payment pending
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-gray-500 text-lg">🗓️</div>
          <div className="text-gray-500 mt-2">No advance bookings for today</div>
          {tomorrowCount > 0 && (
            <div className="text-sm text-gray-600 mt-1">
              {tomorrowCount} booking{tomorrowCount > 1 ? 's' : ''} scheduled for tomorrow
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// URGENT ADVANCE BOOKING NOTIFICATIONS - For all user types
export const AdvanceBookingNotificationBanner = () => {
  const [urgentBookings, setUrgentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    loadUrgentBookings();
    
    // Refresh every 5 minutes for urgent notifications
    const interval = setInterval(loadUrgentBookings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUrgentBookings = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/advance-booking/dashboard-stats/');
      if (response && response.ok) {
        const data = await response.json();
        
        // Filter bookings that are coming up in next 2 hours
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const urgent = (data.today_bookings || []).filter(booking => {
          const bookingTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
          return bookingTime >= now && bookingTime <= twoHoursFromNow;
        });
        
        setUrgentBookings(urgent);
      }
    } catch (error) {
      console.error('Error loading urgent advance bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || urgentBookings.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-orange-500 text-xl animate-pulse">🔔</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            ⏰ Upcoming Advance Bookings (Next 2 Hours)
          </h3>
          <div className="mt-2 space-y-2">
            {urgentBookings.map((booking, index) => (
              <div key={index} className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{booking.customer_name}</span>
                    <span className="mx-1">•</span>
                    <span>{booking.booking_time_formatted || booking.booking_time.slice(0, 5)}</span>
                    <span className="mx-1">•</span>
                    <span>{booking.party_size} people</span>
                  </div>
                  <div className="text-right">
                    {booking.remaining_amount > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Payment pending
                      </span>
                    )}
                    {booking.booking_notes && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        Special notes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ADVANCE BOOKING SUMMARY CARD - For dashboard overview
export const AdvanceBookingSummaryCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest, user } = useAuth();

  useEffect(() => {
    loadSummaryStats();
  }, []);

  const loadSummaryStats = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/advance-booking/dashboard-stats/');
      if (response && response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading advance booking summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white bg-opacity-30 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-white bg-opacity-30 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white bg-opacity-30 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📅 Advance Bookings</h3>
        {user?.is_staff && (
          <Link
            href="/admin/advance-bookings"
            className="text-blue-100 hover:text-white text-sm"
          >
            Manage →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold">
            {stats.today_bookings_count + stats.tomorrow_bookings_count}
          </div>
          <div className="text-blue-100 text-sm">Next 2 Days</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {stats.week_bookings_count}
          </div>
          <div className="text-blue-100 text-sm">This Week</div>
        </div>
      </div>

      {stats.pending_payments_count > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-400">
          <div className="flex justify-between text-sm">
            <span>Pending Payments:</span>
            <span className="font-medium">
              {stats.pending_payments_count} ({formatCurrency(stats.pending_payments_amount)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
