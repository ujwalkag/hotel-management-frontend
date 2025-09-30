// pages/admin/kitchen-display.js - Kitchen Display System
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function KitchenDisplaySystem() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [settings, setSettings] = useState({
        audio_enabled: true,
        auto_refresh_interval: 30,
        priority_color_coding: true,
        show_preparation_time: true,
        show_order_notes: true
    });
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const wsRef = useRef(null);
    const audioRef = useRef(null);

    // WebSocket connection
    useEffect(() => {
        connectWebSocket();

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/kds/`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                toast.success('Kitchen Display connected');
                console.log('KDS WebSocket connected');
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                toast.error('Kitchen Display disconnected');
                console.log('KDS WebSocket disconnected');

                // Attempt to reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('KDS WebSocket error:', error);
                toast.error('Connection error');
            };

            wsRef.current.onmessage = (event) => {
                handleWebSocketMessage(JSON.parse(event.data));
            };

        } catch (error) {
            console.error('Error connecting WebSocket:', error);
            toast.error('Failed to connect to Kitchen Display');
        }
    };

    const handleWebSocketMessage = (data) => {
        console.log('KDS WebSocket message:', data);
        setLastUpdate(new Date().toLocaleTimeString());

        switch (data.type) {
            case 'initial_data':
                setOrders(data.orders || []);
                setTables(data.tables || []);
                setSettings(data.settings || settings);
                break;

            case 'new_order':
                setOrders(prev => [data.order, ...prev]);
                if (data.audio_enabled && settings.audio_enabled) {
                    playNotificationSound();
                }
                toast.success(`New order: ${data.order.menu_item_name} - Table ${data.order.table_number}`);
                break;

            case 'order_updated':
                setOrders(prev => prev.map(order => 
                    order.id === data.order_id 
                        ? { ...order, status: data.status }
                        : order
                ));
                break;

            case 'order_cancelled':
                setOrders(prev => prev.filter(order => order.id !== data.order_id));
                toast.info('Order cancelled');
                break;

            case 'table_updated':
                setTables(prev => prev.map(table =>
                    table.id === data.table.id ? data.table : table
                ));
                break;

            case 'audio_updated':
                setSettings(prev => ({ ...prev, audio_enabled: data.enabled }));
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => {
                console.log('Audio play failed:', e);
            });
        }
    };

    const sendWebSocketMessage = (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    };

    const updateOrderStatus = (orderId, newStatus) => {
        sendWebSocketMessage({
            type: 'update_order_status',
            order_id: orderId,
            status: newStatus,
            user_id: user?.id
        });
    };

    const toggleAudio = () => {
        const newAudioState = !settings.audio_enabled;
        setSettings(prev => ({ ...prev, audio_enabled: newAudioState }));

        sendWebSocketMessage({
            type: 'toggle_audio',
            enabled: newAudioState
        });

        toast.success(`Audio ${newAudioState ? 'enabled' : 'disabled'}`);
    };

    const refreshData = () => {
        sendWebSocketMessage({ type: 'request_refresh' });
        toast.success('Data refreshed');
    };

    const getOrderStatusColor = (status) => {
        const colors = {
            pending: 'bg-orange-100 text-orange-800 border-orange-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            preparing: 'bg-purple-100 text-purple-800 border-purple-200',
            ready: 'bg-green-100 text-green-800 border-green-200',
            served: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || colors.pending;
    };

    const getPriorityColor = (priority) => {
        if (!settings.priority_color_coding) return '';

        const colors = {
            low: 'border-l-4 border-l-gray-400',
            normal: 'border-l-4 border-l-blue-400',
            high: 'border-l-4 border-l-orange-400',
            urgent: 'border-l-4 border-l-red-400'
        };
        return colors[priority] || colors.normal;
    };

    const getTimeSinceOrder = (createdAt) => {
        const now = new Date();
        const orderTime = new Date(createdAt);
        const diffMinutes = Math.floor((now - orderTime) / 60000);

        if (diffMinutes < 60) {
            return `${diffMinutes}m`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours}h ${minutes}m`;
        }
    };

    const formatEstimatedTime = (estimatedTime) => {
        if (!estimatedTime) return 'N/A';

        const now = new Date();
        const estimated = new Date(estimatedTime);
        const diffMinutes = Math.floor((estimated - now) / 60000);

        if (diffMinutes <= 0) return 'Ready';
        return `${diffMinutes}m`;
    };

    const groupOrdersByTable = (orders) => {
        const grouped = {};
        orders.forEach(order => {
            const tableKey = order.table_number;
            if (!grouped[tableKey]) {
                grouped[tableKey] = [];
            }
            grouped[tableKey].push(order);
        });
        return grouped;
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            pending: 'confirmed',
            confirmed: 'preparing',
            preparing: 'ready',
            ready: 'served'
        };
        return statusFlow[currentStatus];
    };

    const getStatusAction = (status) => {
        const actions = {
            pending: 'Confirm',
            confirmed: 'Start Prep',
            preparing: 'Mark Ready',
            ready: 'Mark Served'
        };
        return actions[status] || 'Update';
    };

    const filteredOrders = orders.filter(order => 
        order.status !== 'served' && order.status !== 'cancelled'
    );

    const groupedOrders = groupOrdersByTable(filteredOrders);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Header */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            🍳 Kitchen Display System
                        </h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                            <span className={`flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            {lastUpdate && (
                                <span>Last update: {lastUpdate}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Audio toggle */}
                        <button
                            onClick={toggleAudio}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                settings.audio_enabled 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            {settings.audio_enabled ? '🔊 Audio On' : '🔇 Audio Off'}
                        </button>

                        {/* Refresh button */}
                        <button
                            onClick={refreshData}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Order summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-orange-600 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === 'pending').length}
                        </div>
                        <div className="text-sm">Pending</div>
                    </div>
                    <div className="bg-purple-600 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === 'preparing').length}
                        </div>
                        <div className="text-sm">Preparing</div>
                    </div>
                    <div className="bg-green-600 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === 'ready').length}
                        </div>
                        <div className="text-sm">Ready</div>
                    </div>
                    <div className="bg-blue-600 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{Object.keys(groupedOrders).length}</div>
                        <div className="text-sm">Active Tables</div>
                    </div>
                </div>
            </div>

            {/* Orders by Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(groupedOrders).map(([tableNumber, tableOrders]) => (
                    <div key={tableNumber} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="bg-gray-700 px-4 py-3 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">
                                Table {tableNumber}
                            </h3>
                            <span className="text-sm text-gray-300">
                                {tableOrders.length} {tableOrders.length === 1 ? 'order' : 'orders'}
                            </span>
                        </div>

                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {tableOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`bg-gray-700 rounded-lg p-4 border ${getPriorityColor(order.priority)} hover:bg-gray-600 transition-colors cursor-pointer`}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-white text-lg">
                                                {order.menu_item_name}
                                            </h4>
                                            {order.menu_category && (
                                                <span className="text-sm text-gray-400">
                                                    {order.menu_category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">
                                                x{order.quantity}
                                            </div>
                                            {order.is_veg && (
                                                <span className="text-green-400 text-sm">🟢 Veg</span>
                                            )}
                                            {order.is_spicy && (
                                                <span className="text-red-400 text-sm ml-1">🌶️</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>

                                        <div className="text-right text-sm text-gray-300">
                                            <div>Order: {order.order_number}</div>
                                            <div>{getTimeSinceOrder(order.created_at)} ago</div>
                                        </div>
                                    </div>

                                    {settings.show_preparation_time && order.estimated_ready_time && (
                                        <div className="text-sm text-gray-300 mb-2">
                                            <span className="text-gray-400">Est. ready:</span> {formatEstimatedTime(order.estimated_ready_time)}
                                        </div>
                                    )}

                                    {settings.show_order_notes && order.special_instructions && (
                                        <div className="bg-gray-600 rounded p-2 mb-3">
                                            <div className="text-xs text-gray-400 mb-1">Special Instructions:</div>
                                            <div className="text-sm text-yellow-300">{order.special_instructions}</div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-400">
                                            By: {order.created_by_name}
                                        </div>

                                        {order.status !== 'served' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const nextStatus = getNextStatus(order.status);
                                                    if (nextStatus) {
                                                        updateOrderStatus(order.id, nextStatus);
                                                    }
                                                }}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                                            >
                                                {getStatusAction(order.status)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* No orders message */}
            {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h2 className="text-2xl font-bold text-gray-400 mb-2">No Active Orders</h2>
                    <p className="text-gray-500">Kitchen is all caught up!</p>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">Order Details</h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-400">Order:</span>
                                <span className="text-white ml-2">{selectedOrder.order_number}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Table:</span>
                                <span className="text-white ml-2">{selectedOrder.table_number}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Item:</span>
                                <span className="text-white ml-2">{selectedOrder.menu_item_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Quantity:</span>
                                <span className="text-white ml-2">{selectedOrder.quantity}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${getOrderStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Priority:</span>
                                <span className="text-white ml-2">{selectedOrder.priority}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Ordered by:</span>
                                <span className="text-white ml-2">{selectedOrder.created_by_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Time:</span>
                                <span className="text-white ml-2">{getTimeSinceOrder(selectedOrder.created_at)} ago</span>
                            </div>

                            {selectedOrder.special_instructions && (
                                <div>
                                    <span className="text-gray-400">Instructions:</span>
                                    <div className="text-yellow-300 mt-1 p-2 bg-gray-700 rounded">
                                        {selectedOrder.special_instructions}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex space-x-3">
                            {selectedOrder.status !== 'served' && (
                                <button
                                    onClick={() => {
                                        const nextStatus = getNextStatus(selectedOrder.status);
                                        if (nextStatus) {
                                            updateOrderStatus(selectedOrder.id, nextStatus);
                                            setSelectedOrder(null);
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
                                >
                                    {getStatusAction(selectedOrder.status)}
                                </button>
                            )}

                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio element for notifications */}
            <audio
                ref={audioRef}
                preload="auto"
                src="/sounds/notification.mp3"
            />
        </div>
    );
}

export default withRoleGuard(KitchenDisplaySystem, ['admin','staff','waiter']);

