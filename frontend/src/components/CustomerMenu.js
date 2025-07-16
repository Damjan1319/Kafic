import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Notification from './Notification';
import { validateOrder } from '../utils/validation';
import logger from '../utils/logger';

const CustomerMenu = () => {
  const { tableId } = useParams();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    // Fetch menu from backend
    fetch('/api/menu', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log('Menu data:', data);
        setMenu(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching menu:', err);
        setLoading(false);
        setNotification({
          message: 'Greška pri učitavanju menija',
          type: 'error'
        });
      });
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    // Show floating cart button
    setShowFloatingCart(true);
    
    // Hide floating cart after 3 seconds
    setTimeout(() => {
      setShowFloatingCart(false);
    }, 3000);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const scrollToCart = () => {
    const cartSection = document.getElementById('cart-section');
    if (cartSection) {
      cartSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Listen for scroll events to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const cartSection = document.getElementById('cart-section');
      if (cartSection) {
        const cartRect = cartSection.getBoundingClientRect();
        const isCartVisible = cartRect.top <= window.innerHeight && cartRect.bottom >= 0;
        setShowScrollToTop(isCartVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cart.length]);

  const placeOrder = async () => {
    if (cart.length === 0) return;

    const order = {
      table_id: parseInt(tableId) || 1, // Use tableId from URL or default to 1
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    // Validate order data
    const validationErrors = validateOrder(cart);
    if (validationErrors.length > 0) {
      logger.warn('Order validation failed', { errors: validationErrors, cart });
      setNotification({
        message: `Greška validacije: ${validationErrors.join(', ')}`,
        type: 'error'
      });
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(order)
      });

      const duration = Date.now() - startTime;
      logger.logApiCall('/api/orders', 'POST', response.status, duration);

      if (response.ok) {
        const result = await response.json();
        logger.info('Order placed successfully', { orderId: result.id, tableId: result.table_id });
        setCart([]);
        setNotification({
          message: 'Vaša porudžbina je uspešno poslata! Konobar će je uskoro isporučiti.',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }
    } catch (error) {
      logger.error('Error placing order', { error: error.message, order });
      setNotification({
        message: `Greška pri slanju porudžbine: ${error.message}. Pokušajte ponovo.`,
        type: 'error'
      });
    }
  };

  // Get unique categories from menu data
  const uniqueCategories = [...new Set(menu.map(item => item.category))];
  const categories = ['all', ...uniqueCategories];
  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400 mb-1">Loading menu...</p>
          <p className="text-gray-400">Učitavanje menija...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Meni Kafića
          </h1>
          <p className="text-gray-400 mb-1">Cafe Menu</p>
          {tableId && (
            <div className="mb-2">
              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                Sto {tableId}
              </span>
              <span className="block text-xs opacity-75">Table {tableId}</span>
            </div>
          )}
          <p className="text-gray-400">Izaberite iz našeg ukusnog menija</p>
          <p className="text-sm text-gray-500">Choose from our delicious menu</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-3 lg:gap-4 justify-center sm:justify-start">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm md:text-base whitespace-nowrap flex flex-col items-center ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 border border-gray-700/50'
                }`}
              >
                {category === 'all' ? 'Sve' : 
                 category === 'coffee' ? 'Kafe' :
                 category === 'soda' ? 'Sokovi' :
                 category === 'spirits' ? 'Žestoka' :
                 category === 'beer' ? 'Piva' :
                 category === 'wine' ? 'Vina' :
                 category === 'energy' ? 'Energetska' :
                 category === 'water' ? 'Vode' :
                 category === 'juice' ? 'Sokovi' :
                 category === 'tea' ? 'Topli' :
                 category === 'cocktails' ? 'Kokteli' :
                 category}
                <span className="block text-xs opacity-75">
                  {category === 'all' ? 'All' : 
                   category === 'coffee' ? 'Coffee' :
                   category === 'soda' ? 'Soda' :
                   category === 'spirits' ? 'Spirits' :
                   category === 'beer' ? 'Beer' :
                   category === 'wine' ? 'Wine' :
                   category === 'energy' ? 'Energy' :
                   category === 'water' ? 'Water' :
                   category === 'juice' ? 'Juice' :
                   category === 'tea' ? 'Tea' :
                   category === 'cocktails' ? 'Cocktails' :
                   category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          {filteredMenu.map(item => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 hover:from-gray-700/80 hover:to-gray-800/80 transition-all duration-300 group cursor-pointer border border-gray-700/50 hover:border-blue-500/50 shadow-md hover:shadow-lg hover:shadow-blue-500/10"
              onClick={() => addToCart(item)}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-3">
                <h3 className="text-base sm:text-sm md:text-base lg:text-lg font-semibold text-gray-100 leading-tight line-clamp-1">{item.name}</h3>
                <span className="text-lg sm:text-base md:text-lg lg:text-xl font-bold text-emerald-400">{item.price} RSD</span>
              </div>
              <p className="text-gray-400 text-sm mb-1 sm:mb-2 md:mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">{item.category}</span>
                <button className="px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-3 md:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow text-sm sm:text-base font-medium min-w-[100px] sm:min-w-[130px] md:min-w-[150px] lg:min-w-[170px]">
                  Dodaj
                  <span className="block text-xs opacity-75">Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Cart Button */}
        {showFloatingCart && cart.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 animate-bounce">
            <button
              onClick={scrollToCart}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-5 md:p-6 rounded-full shadow-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center space-x-2 sm:space-x-3 min-w-[80px] sm:min-w-[120px] md:min-w-[140px]"
            >
              <div className="relative">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white text-sm sm:text-base rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm sm:text-base font-semibold">Pogledaj Korpu</span>
                <span className="text-xs opacity-75">View Cart</span>
                <span className="text-xs opacity-75">({totalItems} items)</span>
              </div>
            </button>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollToTop && cart.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 animate-bounce">
            <button
              onClick={scrollToTop}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center space-x-2 sm:space-x-3"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold hidden sm:block">Gore</span>
              <span className="block text-xs opacity-75 hidden sm:block">Top</span>
            </button>
          </div>
        )}

        {/* Cart Section */}
        {cart.length > 0 && (
          <div id="cart-section" className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100 mb-3 sm:mb-4 md:mb-6">Vaša porudžbina</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Your Order</p>
            
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-gray-600/50">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-100 truncate">{item.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{item.price} RSD</p>
                    <span className="text-xs opacity-75">RSD per piece</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 ml-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors shadow-lg text-xs sm:text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-100 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors shadow-lg text-xs sm:text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-emerald-400">
                      {Number(item.price * item.quantity).toFixed(0)} RSD
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-xs sm:text-sm"
                    >
                      Ukloni
                      <span className="block text-xs opacity-75">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100">Ukupno:</span>
                <span className="block text-xs opacity-75">Total:</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">{Number(total).toFixed(0)} RSD</span>
              </div>
              <button
                onClick={placeOrder}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-base sm:text-lg md:text-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25"
              >
                Pošalji porudžbinu
                <span className="block text-xs opacity-75">Send Order</span>
              </button>
            </div>
          </div>
        )}

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

export default CustomerMenu; 