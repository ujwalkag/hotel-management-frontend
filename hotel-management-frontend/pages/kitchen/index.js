import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function EnhancedKitchenDisplay() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(() => 
    localStorage.getItem('kitchen-audio-enabled') === 'true'
  );
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioContextRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Save audio preference
    localStorage.setItem('kitchen-audio-enabled', audioEnabled.toString());
  }, [audioEnabled]);

  useEffect(() => {
    // Play sound when new orders arrive
    if (audioEnabled && orders.length > lastOrderCount && lastOrderCount > 0) {
      playNewOrderSound();
    }
    setLastOrderCount(orders.length);
  }, [orders.length, audioEnabled, lastOrderCount]);

  const fetchOrders = async () => {
    if (!user?.access) return;
    
    try {
      setError('');
      const response = await fetch('/api/kitchen/orders/', {
        headers: { 
          Authorization: `Bearer ${user.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : [];
        setOrders(ordersArray);
        setLastUpdated(new Date());
      } else {
        setError(`Failed to load orders: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Kitchen fetch error:', error);
      setError('Network error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/update-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        playStatusUpdateSound();
      } else {
        setError('Failed to update order status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Network error updating status');
    }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playNewOrderSound = () => {
    if (!audioEnabled) return;
    
    try {
      const audioContext = initAudioContext();
      
      // Play a distinctive new order sound sequence
      const frequencies = [800, 1000, 1200];
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        }, index * 200);
      });
      
      // Also speak the notification
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('New order received');
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.log('Audio not supported or failed');
    }
  };

  const playStatusUpdateSound = () => {
    if (!audioEnabled) return;
    
    try {
      const audioContext = initAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const playUrgentAlert = (orderAge) => {
    if (!audioEnabled || orderAge < 25) return;
    
    try {
      const audioContext = initAudioContext();
      
      // Urgent beeping pattern
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1500;
          oscillator.type = 'square';
          
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 300);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const testAudio = () => {
    if (!audioEnabled) {
      toast.error('Enable audio first');
      return;
    }
    
    playNewOrderSound();
    toast.success('Audio test played');
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
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'served': return 'Served';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Kitchen Orders...</p>
        </div>
      </div>
    );
  }

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🍽️ Enhanced Kitchen Display</h1>
              <p className="text-gray-300">
                {orders.length} total orders • Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    audioEnabled 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {audioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
                </button>
                
                {audioEnabled && (
                  <button
                    onClick={testAudio}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    🎵 Test Sound
                  </button>
                )}
              </div>

              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-2 p-3 bg-red-600 text-white rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="px-6 py-4 bg-gray-800">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{pendingOrders.length}</div>
            <div className="text-sm text-gray-300">Pending Orders</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{preparingOrders.length}</div>
            <div className="text-sm text-gray-300">Preparing</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{readyOrders.length}</div>
            <div className="text-sm text-gray-300">Ready to Serve</div>
          </div>
        </div>
      </div>

      {/* Orders Display */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">All Orders Complete!</h2>
            <p className="text-gray-400">No pending orders in the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const orderAge = getOrderAge(order.created_at);
              const isUrgent = orderAge > 20;
              const isVeryUrgent = orderAge > 30;
              
              // Play urgent alert for very urgent orders
              if (isVeryUrgent && audioEnabled) {
                playUrgentAlert(orderAge);
              }
              
              return (
                <div 
                  key={order.id} 
                  className={`rounded-lg p-6 border-2 transition-all ${
                    isVeryUrgent 
                      ? 'bg-red-900 border-red-500 animate-pulse' 
                      : isUrgent 
                        ? 'bg-yellow-900 border-yellow-500' 
                        : 'bg-gray-800 border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        🪑 Table {order.table_number}
                      </h3>
                      <p className="text-sm text-gray-300">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-300">
                        Customer: {order.customer_name || 'Guest'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {isVeryUrgent && (
                        <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold mb-2 animate-bounce">
                          ⚠️ VERY URGENT
                        </div>
                      )}
                      {isUrgent && !isVeryUrgent && (
                        <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold mb-2">
                          ⏰ URGENT
                        </div>
                      )}
                      <div className="text-lg font-bold text-green-400">{orderAge} min</div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    {order.items?.map((item, index) => (
                      <div key={index} className="mb-3 p-3 bg-gray-700 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-lg">
                              {item.menu_item?.name_en}
                            </h4>
                            {item.menu_item?.name_hi && (
                              <p className="text-gray-300 text-sm">{item.menu_item.name_hi}</p>
                            )}
                            <p className="text-yellow-400 font-bold">Qty: {item.quantity}</p>
                            {item.special_instructions && (
                              <div className="mt-2 p-2 bg-blue-800 rounded">
                                <p className="text-sm text-blue-200">
                                  📝 Note: {item.special_instructions}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-medium"
                      >
                        👨‍🍳 Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium"
                      >
                        ✅ Mark Ready
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium"
                      >
                        🍽️ Mark Served
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

export default withRoleGuard(EnhancedKitchenDisplay, ['admin', 'staff']);

