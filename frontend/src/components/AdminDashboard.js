import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Notification from './Notification';
import Draggable from 'react-draggable';
import notificationService from '../utils/notifications';

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
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    initialStock: ''
  });

  console.log('AdminDashboard render - user:', user);
  console.log('AdminDashboard render - loading:', loading);

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('new_order', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        setNotification({
          message: 'Nova porudžbina je primljena! Pogledajte detalje.',
          type: 'success'
        });

        // Show browser notification
        notificationService.showNewOrderNotification(newOrder);
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
      const [ordersRes, tablesRes, waitersRes, statsRes, menuRes, inventoryRes] = await Promise.all([
        fetch('/api/orders', {
          credentials: 'include'
        }),
        fetch('/api/tables-positions', {
          credentials: 'include'
        }),
        fetch('/api/waiters', {
          credentials: 'include'
        }),
        fetch('/api/statistics', {
          credentials: 'include'
        }),
        fetch('/api/menu-items', {
          credentials: 'include'
        }),
        fetch('/api/inventory', {
          credentials: 'include'
        })
      ]);

      console.log('Response statuses:', {
        orders: ordersRes.status,
        tables: tablesRes.status,
        waiters: waitersRes.status,
        stats: statsRes.status,
        menu: menuRes.status,
        inventory: inventoryRes.status
      });

      if (ordersRes.ok && tablesRes.ok && waitersRes.ok && statsRes.ok && menuRes.ok && inventoryRes.ok) {
        const [ordersData, tablesData, waitersData, statsData, menuData, inventoryData] = await Promise.all([
          ordersRes.json(),
          tablesRes.json(),
          waitersRes.json(),
          statsRes.json(),
          menuRes.json(),
          inventoryRes.json()
        ]);

        console.log('Fetched data:', {
          orders: ordersData,
          tables: tablesData,
          waiters: waitersData,
          statistics: statsData,
          menu: menuData,
          inventory: inventoryData
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
        setMenuItems(menuData);
        setInventory(inventoryData);
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
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
        
        setNotification({
          message: `Porudžbina je ${status === 'approved' ? 'odobrena' : 'završena'}! Dodata je u statistiku.`,
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

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      // Parse initialStock as number
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        initialStock: parseInt(newProduct.initialStock) || 0
      };
      
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setMenuItems(prev => [...prev, addedProduct]);
        
        // Refresh inventory to show the new product
        const inventoryResponse = await fetch('/api/inventory', {
          credentials: 'include'
        });
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setInventory(inventoryData);
        }
        
        setNewProduct({
          name: '',
          category: '',
          price: '',
          description: '',
          initialStock: ''
        });
        setShowAddProduct(false);
        setNotification({
          message: 'Proizvod je uspešno dodat u meni!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setNotification({
        message: 'Greška pri dodavanju proizvoda',
        type: 'error'
      });
    }
  };

  const updateInventory = async (itemId, newStock) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ stock: newStock })
      });

      if (response.ok) {
        setInventory(prev => prev.map(item => 
          item.id === itemId ? { ...item, stock: newStock } : item
        ));
        setNotification({
          message: 'Stanje je uspešno ažurirano!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      setNotification({
        message: 'Greška pri ažuriranju stanja',
        type: 'error'
      });
    }
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
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">👨‍💼</div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-slate-100 truncate">Admin Panel</h1>
                <span className="text-xs opacity-75 block">Admin Panel</span>
                <p className="text-xs text-slate-400 truncate">Dobrodošli, {user?.name}</p>
                <span className="text-xs opacity-75 block">Welcome, {user?.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap"
              >
                Odjavi se
                <span className="block text-xs opacity-75">Logout</span>
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
              { id: 'overview', label: 'Pregled', sublabel: 'Overview', icon: '📊' },
              { id: 'orders', label: 'Porudžbine', sublabel: 'Orders', icon: '🍽️' },
              { id: 'tables', label: 'Stolovi', sublabel: 'Tables', icon: '🪑' },
              { id: 'waiters', label: 'Konobari', sublabel: 'Waiters', icon: '👥' },
              { id: 'menu', label: 'Meni', sublabel: 'Menu', icon: '🍽️' },
              { id: 'inventory', label: 'Inventar', sublabel: 'Inventory', icon: '📦' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-bold">{tab.label}</span>
                <span className="text-xs opacity-75">{tab.sublabel}</span>
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
                    <span className="text-xs opacity-75">Total Orders</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-2">{Number(statistics.overallStats?.totalRevenue || 0).toFixed(0)} RSD</div>
                    <p className="text-xs sm:text-sm text-slate-400">Ukupan prihod</p>
                    <span className="text-xs opacity-75">Total Revenue</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-2">{Number(statistics.overallStats?.averageOrderValue || 0).toFixed(0)} RSD</div>
                    <p className="text-xs sm:text-sm text-slate-400">Prosečna porudžbina</p>
                    <span className="text-xs opacity-75">Average Order</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 shadow-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">{statistics.overallStats?.totalItems || 0}</div>
                    <p className="text-xs sm:text-sm text-slate-400">Ukupno stavki</p>
                    <span className="text-xs opacity-75">Total Items</span>
                  </div>
                </div>

            {/* Product Statistics */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-slate-100">Najprodavaniji proizvodi</h3>
                <p className="text-slate-400 text-sm">Best Selling Products</p>
              </div>
              <div className="p-4 space-y-3">
                {statistics.productStats.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg p-3 border border-slate-600/50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{index + 1}.</span>
                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm">{product.name}</h4>
                        <p className="text-xs text-slate-400">{product.quantitySold} komada</p>
                        <span className="text-xs opacity-75">pieces sold</span>
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
                <p className="text-slate-400 text-sm">Waiter Performance</p>
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
                            <span className="text-xs opacity-75">orders handled</span>
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
                              <span className="text-xs opacity-75">RSD per order</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg p-3 border border-emerald-500/30">
                            <div className="text-center">
                              <div className="text-sm font-bold text-emerald-400">
                                {waiter.ordersHandled > 0 ? Number((waiter.itemsSold || 0) / waiter.ordersHandled).toFixed(1) : 0}
                              </div>
                              <div className="text-xs text-slate-400">Stavki po porudžbini</div>
                              <span className="text-xs opacity-75">Items per order</span>
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
                <p className="text-slate-400 text-sm mb-1">Loading statistics...</p>
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
                <p className="text-slate-400 text-sm mb-1">No orders</p>
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
                          <span className="text-xs opacity-75">Order #{order.order_number}</span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Sto {order.table_id} • {new Date(order.created_at).toLocaleString('sr-RS')}
                          <span className="text-xs opacity-75">Table {order.table_id} • {new Date(order.created_at).toLocaleString('en-US')}</span>
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
                              <span className="text-xs opacity-75">RSD per piece</span>
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
          <div className="space-y-6">
            {user && user.role === 'admin' ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-100">Uredi raspored stolova</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={async () => {
                        try {
                          // Prepare positions array
                          const positions = (showAllTables ? allTables : tables).map(table => ({
                            id: table.id,
                            x: table.x_position,
                            y: table.y_position
                          }));
                          
                          console.log('Saving layout with positions:', positions);
                          
                          // Save all table positions at once
                          const response = await fetch('/api/tables/positions', {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ positions })
                          });
                          
                          console.log('Save layout response status:', response.status);
                          
                          if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Save layout error response:', errorText);
                            throw new Error('Failed to save layout');
                          }
                          
                          const result = await response.json();
                          console.log('Save layout result:', result);
                          
                          // Show success message
                          setNotification({
                            message: 'Raspored je uspešno sačuvan! Svi korisnici će videti promene.',
                            type: 'success'
                          });
                        } catch (error) {
                          console.error('Error saving layout:', error);
                          setNotification({
                            message: 'Greška pri čuvanju rasporeda. Pokušajte ponovo.',
                            type: 'error'
                          });
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                    >
                      💾 Sačuvaj raspored
                      <span className="block text-xs opacity-75">Save Layout</span>
                    </button>
                    <button
                      onClick={toggleShowAllTables}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
                    >
                      {showAllTables ? 'Prikaži postojeće' : 'Prikaži sve stolove'}
                    </button>
                  </div>
                </div>
                
                {/* Mobile: Scrollable container */}
                <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
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
                            },
                            credentials: 'include',
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
                            },
                            credentials: 'include',
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
                        } rounded-lg`}
                        style={{
                          width: '48px',
                          height: '48px',
                          cursor: 'grab',
                          zIndex: 2
                        }}
                        title={`Sto ${table.table_number}${table.isNew ? ' (Novi)' : ''}`}
                      >
                        <div className="text-xs font-bold">{table.table_number}</div>
                        {table.isNew && <div className="text-xs opacity-75">NEW</div>}
                      </div>
                    </Draggable>
                  ))}
                  {/* Šank ili bar */}
                  <div className="absolute left-0 top-0 h-full w-12 sm:w-16 bg-blue-900 opacity-80 flex items-center justify-center text-white font-bold text-xs rotate-[-90deg]" style={{zIndex:1}}>ŠANK<br/>BAR</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-700 border-2 border-blue-400"></div>
                <span>Postojeći stolovi</span>
                <span className="text-xs opacity-75">Existing Tables</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-600 border-2 border-yellow-400"></div>
                <span>Novi stolovi</span>
                <span className="text-xs opacity-75">New Tables</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              {showAllTables 
                ? 'Prevuci stolove na željenu poziciju. Novi stolovi će biti kreirani u bazi kada ih premestite.' 
                : 'Prevuci stolove na željenu poziciju. Pozicija se automatski čuva.'
              }
            </p>
            </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {tables.map(table => (
                    <div key={table.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-700/50 shadow-lg">
                      <div className="text-base font-semibold text-slate-100 mb-1">Sto {table.table_number}</div>
                      <div className="text-xs text-slate-400">Table {table.table_number}</div>
                                              <div className="text-xs text-slate-400">
                          {table.current_order_count} porudžbina
                          <span className="block text-xs opacity-75">orders</span>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-100">Upravljanje menijem</h2>
              <p className="text-slate-400 text-sm">Menu Management</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
              >
                + Dodaj proizvod
                <span className="block text-xs opacity-75">Add Product</span>
              </button>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-100">Dodaj novi proizvod</h3>
                      <p className="text-slate-400 text-sm">Add New Product</p>
                    </div>
                    <button
                      onClick={() => setShowAddProduct(false)}
                      className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={addProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Naziv proizvoda</label>
                      <p className="text-slate-400 text-xs mb-1">Product Name</p>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                  placeholder="Unesite naziv proizvoda (Enter product name)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Kategorija</label>
                      <p className="text-slate-400 text-xs mb-1">Category</p>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      >
                        <option value="">Izaberite kategoriju (Select category)</option>
                        <option value="coffee">Kafe (Coffee)</option>
                        <option value="tea">Čajevi (Tea)</option>
                        <option value="juice">Sokovi (Juice)</option>
                        <option value="water">Vode (Water)</option>
                        <option value="beer">Piva (Beer)</option>
                        <option value="wine">Vina (Wine)</option>
                        <option value="spirits">Alkoholna pića (Spirits)</option>
                        <option value="cocktails">Kokteli (Cocktails)</option>
                        <option value="food">Hrana (Food)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cena (RSD)</label>
                      <p className="text-slate-400 text-xs mb-1">Price (RSD)</p>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                  placeholder="Unesite cenu (Enter price)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Opis</label>
                      <p className="text-slate-400 text-xs mb-1">Description</p>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                  placeholder="Unesite opis proizvoda (Enter product description)"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Početno stanje</label>
                      <p className="text-slate-400 text-xs mb-1">Initial Stock</p>
                      <input
                        type="number"
                        value={newProduct.initialStock}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, initialStock: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                  placeholder="Unesite početno stanje (Enter initial stock)"
                        required
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg font-semibold"
                      >
                        Dodaj proizvod
                        <span className="block text-xs opacity-75">Add Product</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-300 shadow-lg font-semibold"
                      >
                        Otkaži
                        <span className="block text-xs opacity-75">Cancel</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Menu Items List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-semibold text-slate-100">{item.name}</h3>
                    <span className="text-sm font-bold text-emerald-400">{item.price} RSD</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 capitalize">{item.category}</span>
                    <span className="text-xs text-cyan-400">ID: {item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-100">Status - Stanje proizvoda</h2>
            <p className="text-slate-400 text-sm">Product Inventory Status</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-semibold text-slate-100">{item.name}</h3>
                    <span className={`text-sm font-bold ${item.stock > 10 ? 'text-emerald-400' : item.stock > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {item.stock} kom
                      <span className="block text-xs opacity-75">pcs</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Kategorija:</span>
                      <span className="text-xs text-slate-300 capitalize">{item.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Cena:</span>
                      <span className="text-xs text-emerald-400">{item.price} RSD</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateInventory(item.id, parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        min="0"
                      />
                      <span className="text-xs text-slate-400">kom</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 