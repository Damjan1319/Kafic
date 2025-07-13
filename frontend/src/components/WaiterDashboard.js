import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Notification from './Notification';

const WaiterDashboard = () => {
  console.log('=== WaiterDashboard component loaded ===');
  
  const { user, logout } = useAuth();
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showTableMap, setShowTableMap] = useState(false);
  const [showShiftStats, setShowShiftStats] = useState(false);
  const [shiftStats, setShiftStats] = useState(null);

  console.log('WaiterDashboard render - user:', user);
  console.log('WaiterDashboard render - loading:', loading);

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('new_order', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        
        // Update tables with orders
        setTables(prev => prev.map(table => {
          if (table.id === newOrder.table_id) {
            const updatedOrders = [newOrder, ...table.orders];
            
            return {
              ...table,
              orders: updatedOrders,
              pendingOrders: updatedOrders.filter(o => o.status === 'pending'),
              approvedOrders: updatedOrders.filter(o => o.status === 'approved'),
              totalOrders: updatedOrders.length
            };
          }
          return table;
        }));
        
        setNotification({
          message: 'Nova porudžbina je primljena!',
          type: 'success'
        });
      });

      socket.on('order_updated', (updatedOrder) => {
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
        
        // Update tables with orders
        setTables(prev => prev.map(table => {
          if (table.id === updatedOrder.table_id) {
            const updatedOrders = table.orders.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            );
            
            return {
              ...table,
              orders: updatedOrders,
              pendingOrders: updatedOrders.filter(o => o.status === 'pending'),
              approvedOrders: updatedOrders.filter(o => o.status === 'approved'),
              totalOrders: updatedOrders.length
            };
          }
          return table;
        }));
      });

      socket.on('order_deleted', (data) => {
        setOrders(prev => prev.filter(order => order.id !== data.id));
        
        // Update tables with orders
        setTables(prev => prev.map(table => {
          const updatedOrders = table.orders.filter(order => order.id !== data.id);
          
          return {
            ...table,
            orders: updatedOrders,
            pendingOrders: updatedOrders.filter(o => o.status === 'pending'),
            approvedOrders: updatedOrders.filter(o => o.status === 'approved'),
            totalOrders: updatedOrders.length
          };
        }));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('order_deleted');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    console.log('fetchData called');
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      const [ordersRes, tablesRes, tablesPositionsRes] = await Promise.all([
        fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/tables-with-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/tables-positions-view', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      console.log('Response statuses:', {
        orders: ordersRes.status,
        tables: tablesRes.status,
        tablesPositions: tablesPositionsRes.status
      });

      if (ordersRes.ok && tablesRes.ok && tablesPositionsRes.ok) {
        const [ordersData, tablesData, tablesPositionsData] = await Promise.all([
          ordersRes.json(),
          tablesRes.json(),
          tablesPositionsRes.json()
        ]);

        console.log('Fetched data:', {
          orders: ordersData.length,
          tables: tablesData.length,
          tablesPositions: tablesPositionsData.length
        });
        
        console.log('Tables data:', tablesData.map(t => ({ 
          id: t.id, 
          table_number: t.table_number, 
          location: t.location,
          x_position: t.x_position,
          y_position: t.y_position
        })));

        // Kombinuj podatke o stolovima sa pozicijama
        const combinedTables = tablesData.map(table => {
          const positionData = tablesPositionsData.find(pos => pos.id === table.id);
          return {
            ...table,
            x_position: positionData ? positionData.x_position : 0,
            y_position: positionData ? positionData.y_position : 0
          };
        });

        setOrders(ordersData);
        setTables(combinedTables);
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
        
        // Update orders list
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
        
        // Update tables with orders
        setTables(prev => prev.map(table => {
          if (table.id === updatedOrder.table_id) {
            const updatedOrders = table.orders.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            );
            
            return {
              ...table,
              orders: updatedOrders,
              pendingOrders: updatedOrders.filter(o => o.status === 'pending'),
              approvedOrders: updatedOrders.filter(o => o.status === 'approved'),
              totalOrders: updatedOrders.length
            };
          }
          return table;
        }));
        
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

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Remove from orders list
        setOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Update tables with orders
        setTables(prev => prev.map(table => {
          const updatedOrders = table.orders.filter(order => order.id !== orderId);
          
          return {
            ...table,
            orders: updatedOrders,
            pendingOrders: updatedOrders.filter(o => o.status === 'pending'),
            approvedOrders: updatedOrders.filter(o => o.status === 'approved'),
            totalOrders: updatedOrders.length
          };
        }));
        
        setNotification({
          message: 'Porudžbina je obrisana!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setNotification({
        message: 'Greška pri brisanju porudžbine',
        type: 'error'
      });
    }
  };

  const fetchShiftStats = async () => {
    try {
      console.log('Fetching shift stats...');
      const response = await fetch('/api/shift-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Shift stats response status:', response.status);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('Shift stats data:', stats);
        setShiftStats(stats);
      } else {
        console.error('Failed to fetch shift stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching shift stats:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'approved':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Učitavanje...</p>
        </div>
      </div>
    );
  }

  // Sort orders: pending first, then approved, then completed
  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { 'pending': 0, 'approved': 1, 'completed': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Konobar Dashboard
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Dobrodošli, {user?.name}</p>
          </div>
          
          {/* Mobile: Stack buttons vertically */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto">
            <button
              onClick={() => setShowTableMap(!showTableMap)}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg text-sm sm:text-base font-medium"
            >
              {showTableMap ? 'Sakrij mapu' : 'Mapa stolova'}
            </button>

            <button
              onClick={() => {
                setShowShiftStats(!showShiftStats);
                if (!showShiftStats && !shiftStats) {
                  fetchShiftStats();
                }
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg text-sm sm:text-base font-medium"
            >
              {showShiftStats ? 'Sakrij statistiku' : 'Statistika smene'}
            </button>
            
            <button
              onClick={logout}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg text-sm sm:text-base font-medium"
            >
              Odjavi se
            </button>
          </div>
        </div>

        {/* Shift Statistics Section */}
        {showShiftStats && (
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100 mb-4 sm:mb-6">Statistika smene</h2>
            
            {shiftStats ? (
              <>
                {/* Overall Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center border border-gray-700/50 shadow-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-cyan-400 mb-1 sm:mb-2">{shiftStats.totalOrders || 0}</div>
                    <p className="text-gray-400 text-xs sm:text-sm">Ukupno porudžbina</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center border border-gray-700/50 shadow-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-emerald-400 mb-1 sm:mb-2">{Number(shiftStats.totalRevenue || 0).toFixed(0)} RSD</div>
                    <p className="text-gray-400 text-xs sm:text-sm">Ukupan pazar</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center border border-gray-700/50 shadow-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-indigo-400 mb-1 sm:mb-2">{Number(shiftStats.averageOrderValue || 0).toFixed(0)} RSD</div>
                    <p className="text-gray-400 text-xs sm:text-sm">Prosečna porudžbina</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center border border-gray-700/50 shadow-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-400 mb-1 sm:mb-2">{shiftStats.totalItems || 0}</div>
                    <p className="text-gray-400 text-xs sm:text-sm">Ukupno stavki</p>
                  </div>
                </div>

            {/* Product Stats */}
            {shiftStats.productStats && shiftStats.productStats.length > 0 && (
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-100 mb-3 sm:mb-4 lg:mb-6">Prodato u smeni</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {shiftStats.productStats.map((product, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">{product.name}</h4>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Prodato komada:</span>
                          <span className="text-gray-100 font-semibold">{product.quantitySold}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Prihod:</span>
                          <span className="text-emerald-400 font-semibold">{Number(product.totalRevenue || 0).toFixed(0)} RSD</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Porudžbina:</span>
                          <span className="text-gray-100 font-semibold">{product.orders}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shift Info */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-700/50 shadow-xl">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Informacije o smeni</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Konobar:</p>
                  <p className="text-gray-100 font-semibold text-sm sm:text-base">{user?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Datum:</p>
                  <p className="text-gray-100 font-semibold text-sm sm:text-base">{new Date().toLocaleDateString('sr-RS')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Vreme:</p>
                  <p className="text-gray-100 font-semibold text-sm sm:text-base">{new Date().toLocaleTimeString('sr-RS')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Status:</p>
                  <p className="text-emerald-400 font-semibold text-sm sm:text-base">Aktivna smena</p>
                </div>
              </div>
            </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center border border-gray-700/50 shadow-xl">
                <div className="text-3xl sm:text-4xl lg:text-6xl mb-3 sm:mb-4">📊</div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-100 mb-2">Statistika se učitava</h3>
                <p className="text-gray-400 text-sm sm:text-base">Molimo sačekajte...</p>
              </div>
            )}
          </div>
        )}

        {/* Table Map Section */}
        {showTableMap && (
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100 mb-3 sm:mb-4 lg:mb-6">Mapa stolova</h2>
            
            {/* Mobile: Scrollable container */}
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {/* Scrollable area for mobile */}
              <div className="w-full h-full overflow-auto">
                <div className="relative w-full h-full min-w-[600px] min-h-[400px]">
                  {tables && tables.map((table) => {
                    // Proveri status porudžbina
                    const pendingOrders = table.orders && table.orders.filter(order => order.status === 'pending');
                    const approvedOrders = table.orders && table.orders.filter(order => order.status === 'approved');
                    const totalOrders = table.orders ? table.orders.length : 0;
                    
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
                    
                    // Odredi boju na osnovu statusa porudžbina
                    let borderColor = baseBorderColor;
                    let bgColor = baseBgColor;
                    
                    if (pendingOrders && pendingOrders.length > 0) {
                      borderColor = 'border-yellow-400';
                      bgColor = 'bg-yellow-600';
                    } else if (approvedOrders && approvedOrders.length > 0) {
                      borderColor = 'border-green-400';
                      bgColor = 'bg-green-600';
                    }
                    
                    return (
                      <div
                        key={table.id}
                        className={`absolute flex flex-col items-center justify-center shadow-lg text-white font-bold transition-all duration-200 border-2 ${borderColor} ${bgColor} rounded-lg`}
                        style={{
                          left: `${table.x_position}px`,
                          top: `${table.y_position}px`,
                          width: '48px',
                          height: '48px',
                          cursor: 'default',
                          zIndex: 2
                        }}
                        title={`Sto ${table.table_number} - ${totalOrders} porudžbina`}
                      >
                        <div className="text-xs font-bold">{table.table_number}</div>
                        <div className="text-xs opacity-75">
                          {totalOrders}
                        </div>
                      </div>
                    );
                  })}
                  {/* Šank ili bar */}
                  <div className="absolute left-0 top-0 h-full w-12 sm:w-16 bg-blue-900 opacity-80 flex items-center justify-center text-white font-bold text-xs rotate-[-90deg]" style={{zIndex:1}}>ŠANK</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100 mb-3 sm:mb-4 lg:mb-6">Porudžbine</h2>
          
          {sortedOrders.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center border border-gray-700/50 shadow-xl">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-3 sm:mb-4">🍽️</div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-100 mb-2">Nema porudžbina</h3>
              <p className="text-gray-400 text-sm sm:text-base">Porudžbine će se ovde prikazati kada stignu</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 lg:gap-6">
              {sortedOrders.map(order => (
                <div key={order.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 lg:p-6 gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-100">
                          Porudžbina #{order.order_number}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Sto {order.table_id} • {new Date(order.created_at).toLocaleString('sr-RS')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400">
                        {order.total_price} RSD
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                    <div className="space-y-2 mb-3 sm:mb-4 lg:mb-6">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-600/50">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-xs sm:text-sm font-semibold text-gray-100">{item.quantity}x</span>
                            <div>
                              <h4 className="font-semibold text-gray-100 text-xs sm:text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-400">{item.price} RSD komad</p>
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {Number(item.price * item.quantity).toFixed(0)} RSD
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'approved')}
                          className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg text-xs sm:text-sm lg:text-base font-medium"
                        >
                          Odobri porudžbinu
                        </button>
                      )}
                      {order.status === 'approved' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg text-xs sm:text-sm lg:text-base font-medium"
                        >
                          Završi porudžbinu
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg text-xs sm:text-sm lg:text-base font-medium"
                        >
                          Obriši porudžbinu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard; 