import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import Notification from './Notification';

const CustomerMenu = () => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    // Fetch menu from backend
    fetch('/api/menu')
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

  const placeOrder = async () => {
    if (cart.length === 0) return;

    const order = {
      table_id: 1, // Default table for testing
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Order placed successfully:', result);
        setCart([]);
        setNotification({
          message: 'Porudžbina je uspešno poslata! Konobar će je uskoro isporučiti.',
          type: 'success'
        });
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setNotification({
        message: 'Greška pri slanju porudžbine',
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
            Cafe Menu
          </h1>
          <p className="text-gray-400">Izaberite iz našeg ukusnog menija</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 border border-gray-700/50'
                }`}
              >
                {category === 'all' ? 'Sve' : 
                 category === 'coffee' ? 'Kafe' :
                 category === 'soda' ? 'Sokovi' :
                 category === 'spirits' ? 'Žestoka pića' :
                 category === 'beer' ? 'Piva' :
                 category === 'wine' ? 'Vina' :
                 category === 'energy' ? 'Energetska pića' :
                 category === 'water' ? 'Vode' :
                 category === 'juice' ? 'Sokovi' :
                 category === 'tea' ? 'Topli napitci' :
                 category === 'cocktails' ? 'Kokteli' :
                 category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {filteredMenu.map(item => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 hover:from-gray-700/80 hover:to-gray-800/80 transition-all duration-300 group cursor-pointer border border-gray-700/50 hover:border-blue-500/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10"
              onClick={() => addToCart(item)}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-100">{item.name}</h3>
                <span className="text-xl sm:text-2xl font-bold text-emerald-400">{item.price} RSD</span>
              </div>
              <p className="text-gray-400 text-sm mb-3 sm:mb-4">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">{item.category}</span>
                <button className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg text-sm">
                  Dodaj u korpu
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Cart Button */}
        {showFloatingCart && cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <button
              onClick={scrollToCart}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-full shadow-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center space-x-3"
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold">Pogledaj porudžbinu</span>
            </button>
          </div>
        )}

        {/* Cart Section */}
        {cart.length > 0 && (
          <div id="cart-section" className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6">Vaša porudžbina</h2>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-600/50">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-100">{item.name}</h3>
                    <p className="text-gray-400">{item.price} RSD komad</p>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 sm:w-8 h-6 sm:h-8 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors shadow-lg text-sm"
                      >
                        -
                      </button>
                      <span className="text-base sm:text-lg font-semibold text-gray-100 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 sm:w-8 h-6 sm:h-8 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors shadow-lg text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-emerald-400">
                      {Number(item.price * item.quantity).toFixed(0)} RSD
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    >
                      Ukloni
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-gray-100">Ukupno:</span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{Number(total).toFixed(0)} RSD</span>
              </div>
              <button
                onClick={placeOrder}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 sm:py-4 rounded-xl text-lg sm:text-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25"
              >
                Pošalji porudžbinu
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