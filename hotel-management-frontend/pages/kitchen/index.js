import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';

function KitchenDisplay() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000); // 20 second refresh
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.access) return;
    
    try {
      setError('');
      const response = await fetch('/api/tables/kitchen/', {
        headers: { 
          Authorization: `Bearer ${user.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Kitchen API Response:', data); // Debug log
        
        const ordersArray = Array.isArray(data) ? data : [];
        setOrders(ordersArray);
        setLastUpdated(new Date());
        
        // Audio notification for new orders
        if (audioEnabled && ordersArray.length > 0) {
          playNotificationSound();
        }
      } else {
        setError(`Failed to load orders / ऑर्डर लोड करने में विफल: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Kitchen fetch error:', error);
      setError('Network error loading orders / ऑर्डर लोड करने में नेटवर्क त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/tables/kitchen/${orderId}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      } else {
        setError('Failed to update order status / ऑर्डर स्थिति अपडेट करने में विफल');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Network error updating status / स्थिति अपडेट करने में नेटवर्क त्रुटि');
    }
  };

  const playNotificationSound = () => {
    // Simple beep sound (you can replace with actual audio file)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-red-100 border-red-500 text-red-800';
      case 'preparing': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'ready': return 'bg-green-100 border-green-500 text-green-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending / लंबित';
      case 'preparing': return 'Preparing / तैयार हो रहा';
      case 'ready': return 'Ready / तैयार';
      case 'served': return 'Served / परोसा गया';
      default: return status;
    }
  };

  const getOrderAge = (orderTime) => {
    const now = new Date();
    const created = new Date(orderTime);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    return diffMinutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Kitchen Orders... / किचन ऑर्डर लोड हो रहे हैं...</p>
        </div>
      </div>
    );
  }

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.order_item?.status === 'pending');
  const preparingOrders = orders.filter(order => order.order_item?.status === 'preparing');
  const readyOrders = orders.filter(order => order.order_item?.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ߍ Kitchen Display / किचन डिस्प्ले</h1>
              <p className="text-gray-600">
                {orders.length} total orders / कुल ऑर्डर • Last updated / अंतिम अपडेट: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`px-4 py-2 rounded ${audioEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
              >
                ߔ Audio {audioEnabled ? 'ON / चालू' : 'OFF / बंद'}
              </button>
              <button
                onClick={fetchOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                ߔ Refresh / रिफ्रेश
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-100 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-red-800">{pendingOrders.length}</h3>
            <p className="text-red-600">Pending Orders / लंबित ऑर्डर</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-yellow-800">{preparingOrders.length}</h3>
            <p className="text-yellow-600">Preparing / तैयार हो रहे</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-800">{readyOrders.length}</h3>
            <p className="text-green-600">Ready to Serve / परोसने के लिए तैयार</p>
          </div>
        </div>

        {/* Orders Display */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">ߎ</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">All Orders Complete! / सभी ऑर्डर पूरे!</h2>
            <p className="text-gray-500">No pending orders in the kitchen / किचन में कोई लंबित ऑर्डर नहीं</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const orderAge = getOrderAge(order.display_time || order.order_item?.order_time);
              const isUrgent = orderAge > 20;
              
              return (
                <div
                  key={order.id}
                  className={`bg-white border-2 rounded-lg p-4 shadow-md ${getStatusColor(order.order_item?.status)} ${isUrgent ? 'animate-pulse border-red-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold">Table {order.table_number} / टेबल {order.table_number}</h3>
                      <p className="text-sm text-gray-600">Order #{order.order_number} / ऑर्डर नं.</p>
                    </div>
                    {isUrgent && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        URGENT / तत्काल
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="font-semibold">{order.order_item?.menu_item?.name_en}</p>
                    {order.order_item?.menu_item?.name_hi && (
                      <p className="text-sm text-gray-600">{order.order_item.menu_item.name_hi}</p>
                    )}
                    <p className="text-sm text-gray-600">Qty / मात्रा: {order.order_item?.quantity}</p>
                    {order.order_item?.special_instructions && (
                      <p className="text-sm italic text-blue-600">
                        Note / नोट: {order.order_item.special_instructions}
                      </p>
                    )}
                  </div>

                  <div className="mb-3 text-sm text-gray-600">
                    <p>Customer / ग्राहक: {order.customer_name}</p>
                    <p>Waiter / वेटर: {order.waiter_name}</p>
                    <p>Age / समय: {orderAge} minutes / मिनट</p>
                    <p>Status / स्थिति: {getStatusText(order.order_item?.status)}</p>
                  </div>

                  <div className="flex gap-2">
                    {order.order_item?.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Start Cooking / खाना बनाना शुरू करें
                      </button>
                    )}
                    {order.order_item?.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Food Ready / खाना तैयार
                      </button>
                    )}
                    {order.order_item?.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Mark Served / परोसा गया
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(KitchenDisplay, ['admin', 'staff']);

