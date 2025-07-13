import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Notification from './Notification';
import Draggable from 'react-draggable';

const AdminDashboard = () => {
  console.log('=== AdminDashboard component loaded ===');
  
  const { user, logout } = useAuth();
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [expandedWaiters, setExpandedWaiters] = useState(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllTables, setShowAllTables] = useState(false);
  const [allTables, setAllTables] = useState([]);

  console.log('AdminDashboard render - user:', user);
  console.log('AdminDashboard render - loading:', loading);

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('new_order', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        setNotification({
          message: 'Nova porudžbina je primljena!',
          type: 'success'
        });
      });

      socket.on('order_updated', (updatedOrder) => {
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_updated');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    console.log('fetchData called');
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      const [ordersRes, tablesRes, waitersRes, statsRes] = await Promise.all([
        fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/tables-positions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/waiters', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/statistics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      console.log('Response statuses:', {
        orders: ordersRes.status,
        tables: tablesRes.status,
        waiters: waitersRes.status,
        stats: statsRes.status
      });

      if (ordersRes.ok && tablesRes.ok && waitersRes.ok && statsRes.ok) {
        const [ordersData, tablesData, waitersData, statsData] = await Promise.all([
          ordersRes.json(),
          tablesRes.json(),
          waitersRes.json(),
          statsRes.json()
        ]);

        console.log('Fetched data:', {
          orders: ordersData,
          tables: tablesData,
          waiters: waitersData,
          statistics: statsData
        });

        console.log('Statistics details:', {
          overallStats: statsData.overallStats,
          productStats: statsData.productStats,
          waiterStats: statsData.waiterStats
        });

        setOrders(ordersData);
        setTables(tablesData);
        setWaiters(waitersData);
        setStatistics(statsData);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.message);
      setNotification({
        message: 'Greška pri učitavanju podataka',
        type: 'error'
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
        
        setNotification({
          message: `Porudžbina je ${status === 'approved' ? 'odobrena' : 'završena'}!`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setNotification({
        message: 'Greška pri ažuriranju porudžbine',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'approved':
        return 'text-blue-400 bg-blue-400/10';
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Na čekanju';
      case 'approved':
        return 'Odobreno';
      case 'completed':
        return 'Završeno';
      default:
        return status;
    }
  };

  const getWaiterName = (waiterId) => {
    const waiter = waiters.find(w => w.id === waiterId);
    return waiter ? waiter.name : 'Nepoznato';
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleWaiterExpansion = (waiterId) => {
    setExpandedWaiters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(waiterId)) {
        newSet.delete(waiterId);
      } else {
        newSet.add(waiterId);
      }
      return newSet;
    });
  };

  // Generisanje svih stolova od 1-30 sa default pozicijama
  const generateAllTables = () => {
    const generatedTables = [];
    const existingTableNumbers = new Set(tables.map(t => t.table_number));
    
    for (let i = 1; i <= 30; i++) {
      const existingTable = tables.find(t => t.table_number === i);
      
      if (existingTable) {
        // Koristi postojeći sto sa njegovom pozicijom
        generatedTables.push(existingTable);
      } else {
        // Kreiraj novi sto sa default pozicijom
        const defaultX = 100 + (i % 6) * 80; // 6 stolova u redu
        const defaultY = 100 + Math.floor((i - 1) / 6) * 80; // Novi red svakih 6 stolova
        
        generatedTables.push({
          id: `temp_${i}`,
          table_number: i,
          x_position: defaultX,
          y_position: defaultY,
          location: 'indoor',
          current_order_count: 0,
          isNew: true // Oznaka da je novi sto
        });
      }
    }
    
    return generatedTables;
  };

  // Toggle za prikaz svih stolova
  const toggleShowAllTables = () => {
    if (!showAllTables) {
      const allTablesData = generateAllTables();
      setAllTables(allTablesData);
    }
    setShowAllTables(!showAllTables);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">👨‍💼</div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Admin Panel</h1>
                <p className="text-xs text-slate-400">Dobrodošli, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Pregled', icon: '📊' },
              { id: 'orders', label: 'Porudžbine', icon: '🍽️' },
              { id: 'tables', label: 'Stolovi', icon: '🪑' },
              { id: 'waiters', label: 'Konobari', icon: '👥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statistics ? (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">{statistics.overallStats?.totalOrders || 0}</div>
                    <p className="text-xs sm:text-sm text-slate-400">Ukupno porudžbina</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-2">{Number(statistics.overallStats?.totalRevenue || 0).toFixed(0)} RSD</div>
                    <p className="text-xs sm:text-sm text-slate-400">Ukupan prihod</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-2">{Number(statistics.overallStats?.averageOrderValue || 0).toFixed(0)} RSD</div>
                    <p className="text-xs sm:text-sm text-slate-400">Prosečna porudžbina</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">{statistics.overallStats?.totalItems || 0}</div>
                    <p className="text-xs sm:text-sm text-slate-400">Ukupno stavki</p>
                  </div>
                </div>

            {/* Product Statistics */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-slate-100">Najprodavaniji proizvodi</h3>
              </div>
              <div className="p-4 space-y-3">
                {statistics.productStats.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg p-3 border border-slate-600/50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{index + 1}.</span>
                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm">{product.name}</h4>
                        <p className="text-xs text-slate-400">{product.quantitySold} komada</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{Number(product.totalRevenue || 0).toFixed(0)} RSD</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waiter Statistics */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-slate-100">Performanse konobara</h3>
              </div>
              <div className="p-4 space-y-3">
                {statistics.waiterStats.map((waiter, index) => (
                  <div key={waiter.id} className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 overflow-hidden">
                    <div className="p-3 cursor-pointer hover:bg-slate-600/30 transition-colors" onClick={() => toggleWaiterExpansion(waiter.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-slate-100">{index + 1}.</span>
                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm">{waiter.name}</h4>
                            <p className="text-xs text-slate-400">{waiter.ordersHandled} porudžbina</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-emerald-400">{Number(waiter.totalRevenue || 0).toFixed(0)} RSD</span>
                          <button className="text-slate-400 hover:text-slate-100 transition-colors">
                            {expandedWaiters.has(waiter.id) ? '▼' : '▶'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedWaiters.has(waiter.id) && (
                      <div className="px-3 pb-3 border-t border-slate-600/50">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg p-3 border border-blue-500/30">
                            <div className="text-center">
                              <div className="text-sm font-bold text-blue-400">
                                {waiter.ordersHandled > 0 ? Number((waiter.totalRevenue || 0) / waiter.ordersHandled).toFixed(0) : 0}
                              </div>
                              <div className="text-xs text-slate-400">RSD po porudžbini</div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg p-3 border border-emerald-500/30">
                            <div className="text-center">
                              <div className="text-sm font-bold text-emerald-400">
                                {waiter.ordersHandled > 0 ? Number((waiter.itemsSold || 0) / waiter.ordersHandled).toFixed(1) : 0}
                              </div>
                              <div className="text-xs text-slate-400">Stavki po porudžbini</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-700/50 shadow-xl">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Statistika se učitava</h3>
                <p className="text-slate-400 text-sm">Molimo sačekajte...</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-700/50 shadow-xl">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Nema porudžbina</h3>
                <p className="text-slate-400 text-sm">Porudžbine će se ovde prikazati kada stignu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors" onClick={() => toggleOrderExpansion(order.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-100">
                            Porudžbina #{order.order_number}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Sto {order.table_id} • {new Date(order.created_at).toLocaleString('sr-RS')}
                            {order.waiter_id && ` • ${getWaiterName(order.waiter_id)}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-base font-bold text-emerald-400">
                            {order.total_price} RSD
                          </span>
                          <button className="text-slate-400 hover:text-slate-100 transition-colors">
                            {expandedOrders.has(order.id) ? '▼' : '▶'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedOrders.has(order.id) && (
                      <div className="px-4 pb-4 border-t border-slate-700/50">
                        <div className="space-y-2 mt-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg p-3 border border-slate-600/50">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-slate-100">{item.quantity}x</span>
                                <div>
                                  <h4 className="font-semibold text-slate-100 text-sm">{item.name}</h4>
                                  <p className="text-xs text-slate-400">{item.price} RSD komad</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-emerald-400">
                                {Number((item.price || 0) * (item.quantity || 0)).toFixed(0)} RSD
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-2 mt-4">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'approved')}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg text-sm"
                            >
                              Odobri
                            </button>
                          )}
                          {order.status === 'approved' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg text-sm"
                            >
                              Završi
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {tables.map(table => (
                <div key={table.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-700/50 shadow-lg">
                  <div className="text-base font-semibold text-slate-100 mb-1">Sto {table.table_number}</div>
                  <div className="text-xs text-slate-400">
                    {table.current_order_count} porudžbina
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiters Tab */}
        {activeTab === 'waiters' && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {waiters.map(waiter => (
                <div key={waiter.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">{waiter.name}</h3>
                      <p className="text-xs text-slate-400">{waiter.username} • {waiter.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && user.role === 'admin' && (
          <div className="my-4 sm:my-6 lg:my-8">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-100">Uredi raspored stolova</h2>
            </div>
            
            {/* Mobile: Scrollable container */}
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-800 rounded-xl mb-4 sm:mb-6 lg:mb-8 border border-gray-700 overflow-hidden">
              {/* Scrollable area for mobile */}
              <div className="w-full h-full overflow-auto">
                <div className="relative w-full h-full min-w-[600px] min-h-[400px]">
              {(showAllTables ? allTables : tables) && (showAllTables ? allTables : tables).map((table) => (
                <Draggable
                  key={table.id}
                  position={{ x: table.x_position, y: table.y_position }}
                  onStop={(_, data) => {
                    // Ažuriraj lokalno stanje odmah
                    if (showAllTables) {
                      setAllTables(prev => prev.map(t => 
                        t.id === table.id 
                          ? { ...t, x_position: data.x, y_position: data.y }
                          : t
                      ));
                    } else {
                      setTables(prev => prev.map(t => 
                        t.id === table.id 
                          ? { ...t, x_position: data.x, y_position: data.y }
                          : t
                      ));
                    }

                    // Pozovi backend da sačuva novu poziciju
                    if (table.isNew) {
                      // Ako je novi sto, prvo ga kreiraj u bazi
                      fetch('/api/tables', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          table_number: table.table_number,
                          x_position: data.x,
                          y_position: data.y,
                          location: 'indoor'
                        })
                      }).then(response => {
                        if (response.ok) {
                          // Ažuriraj lokalno stanje da ukloni isNew flag
                          setAllTables(prev => prev.map(t => 
                            t.id === table.id 
                              ? { ...t, isNew: false }
                              : t
                          ));
                        }
                      });
                    } else {
                      // Postojeći sto - samo ažuriraj poziciju
                      fetch(`/api/tables/${table.id}/position`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ x_position: data.x, y_position: data.y })
                      });
                    }
                  }}
                >
                  <div
                    className={`absolute flex flex-col items-center justify-center shadow-lg text-white font-bold transition-all duration-200 border-2 ${
                      table.isNew 
                        ? 'border-yellow-400 bg-yellow-600' 
                        : (() => {
                            // Odredi boju na osnovu lokacije stola (unutra/napolju)
                            let baseBorderColor = 'border-blue-400';
                            let baseBgColor = 'bg-blue-600';
                            
                            // Unutrašnji stolovi (1-13) - plavi
                            if (table.table_number >= 1 && table.table_number <= 13) {
                              baseBorderColor = 'border-blue-400';
                              baseBgColor = 'bg-blue-600';
                            }
                            // Spoljašnji stolovi (14-30) - zeleni
                            else if (table.table_number >= 14 && table.table_number <= 30) {
                              baseBorderColor = 'border-green-400';
                              baseBgColor = 'bg-green-600';
                            }
                            
                            return `${baseBorderColor} ${baseBgColor}`;
                          })()
                    }`}
                    style={{
                      width: '48px',
                      height: '48px',
                      cursor: 'move',
                      zIndex: 2
                    }}
                    title={`Sto ${table.table_number}${table.isNew ? ' (novi)' : ''}`}
                  >
                    <div className="text-xs font-bold">{table.table_number}</div>
                    {table.isNew && (
                      <div className="text-xs opacity-75">Novi</div>
                    )}
                  </div>
                </Draggable>
              ))}
              {/* Šank ili bar - pomeren unazad */}
              <div className="absolute left-[-80px] top-0 h-full w-16 bg-blue-900 opacity-80 flex items-center justify-center text-white font-bold text-xs rotate-[-90deg]" style={{zIndex:1}}>ŠANK</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-700 border-2 border-blue-400"></div>
                <span>Postojeći stolovi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-600 border-2 border-yellow-400"></div>
                <span>Novi stolovi</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              {showAllTables 
                ? 'Prevuci stolove na željenu poziciju. Novi stolovi će biti kreirani u bazi kada ih premestite.' 
                : 'Prevuci stolove na željenu poziciju. Pozicija se automatski čuva.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 