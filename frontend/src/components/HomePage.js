import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-6 animate-pulse">☕</div>
          <h1 className="text-5xl font-bold text-slate-100 mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Sistem za Poručivanje u Kafiću
          </h1>
          <p className="text-xl text-slate-400 mb-2">Cafe Ordering System</p>
          <p className="text-lg text-slate-500">Moderan sistem za poručivanje u kafiću</p>
          <p className="text-sm text-slate-600">Modern cafe ordering system</p>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Staff Access */}
          <div 
            className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:scale-105"
            onClick={() => navigate('/login')}
          >
            <div className="text-6xl mb-6">👨‍💼</div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Zaposleni</h2>
            <p className="text-lg text-slate-400 mb-1">Staff Access</p>
            <p className="text-lg text-slate-400 mb-6">Prijavite se kao admin ili konobar</p>
            <p className="text-sm text-slate-500 mb-1">Login as admin or waiter</p>
            <div className="space-y-2 text-sm text-slate-500">
              <div>• Admin: admin / admin123</div>
              <div className="text-xs opacity-75">• Admin: admin / admin123</div>
              <div>• Konobar: waiter / waiter123</div>
              <div className="text-xs opacity-75">• Waiter: waiter / waiter123</div>
              <div>• Konobar 2: waiter2 / waiter123</div>
              <div className="text-xs opacity-75">• Waiter 2: waiter2 / waiter123</div>
            </div>
          </div>

          {/* Customer Access */}
          <div 
            className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:scale-105"
            onClick={() => navigate('/customer')}
          >
            <div className="text-6xl mb-6">🍽️</div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Gosti</h2>
            <p className="text-lg text-slate-400 mb-1">Customer Access</p>
            <p className="text-lg text-slate-400 mb-6">Pristupite meniju za poručivanje</p>
            <p className="text-sm text-slate-500 mb-1">Access the menu for ordering</p>
            <div className="space-y-2 text-sm text-slate-500">
              <div>• Direktan pristup meniju</div>
              <div className="text-xs opacity-75">• Direct menu access</div>
              <div>• Dodajte proizvode u korpu</div>
              <div className="text-xs opacity-75">• Add products to cart</div>
              <div>• Pošaljite porudžbinu</div>
              <div className="text-xs opacity-75">• Send order</div>
            </div>
          </div>
        </div>

        {/* Test Options */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/30">
          <h3 className="text-2xl font-bold text-slate-100 mb-2 text-center">Test Opcije</h3>
          <p className="text-lg text-slate-400 mb-6 text-center">Test Options</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/customer')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🍽️ Test Meni
              <span className="block text-xs opacity-75">Test Menu</span>
            </button>
            <button 
              onClick={() => navigate('/customer/table/29')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🍽️ Sto 29
              <span className="block text-xs opacity-75">Table 29</span>
            </button>
            <button 
              onClick={() => navigate('/qr')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📱 QR Scanner
              <span className="block text-xs opacity-75">QR Scanner</span>
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              👨‍💼 Login Panel
              <span className="block text-xs opacity-75">Login Panel</span>
            </button>
            <button 
              onClick={() => navigate('/customer/table/1')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🍽️ Sto 1
              <span className="block text-xs opacity-75">Table 1</span>
            </button>
          </div>
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-xl">
            <p className="text-yellow-300 text-sm text-center">
              ⚠️ Za pristup admin/waiter panelima, prvo se prijavite preko Login Panel dugmeta
            </p>
            <p className="text-yellow-400 text-xs text-center">
              ⚠️ To access admin/waiter panels, first login via Login Panel button
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Za testiranje sistema, kliknite na "Test Meni" za pristup meniju gostiju
          </p>
          <p className="text-slate-500 text-xs">
            To test the system, click on "Test Menu" to access the customer menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 