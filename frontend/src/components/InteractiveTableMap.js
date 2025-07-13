import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const InteractiveTableMap = () => {
  // All hooks at the top
  const [tables, setTables] = useState([]);
  const [draggedTable, setDraggedTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);
  const { user } = useAuth();

  // Fetch tables with positions
  const fetchTables = async () => {
    try {
      console.log('Fetching tables with positions...');
      const response = await fetch('/api/tables-positions', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tables:', data);
        setTables(data);
      } else {
        console.error('Failed to fetch tables:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line
  }, []);

  // Check if user is admin (after all hooks)
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-4">Pristup odbijen</h2>
          <p className="text-gray-300 mb-6">Samo administrator može da pristupi interaktivnoj mapi stolova.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
          >
            Nazad
          </button>
        </div>
      </div>
    );
  }

  // Update table position in database
  const updateTablePosition = async (tableId, x, y) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ x, y })
      });
      
      if (!response.ok) {
        console.error('Error updating table position');
      }
    } catch (error) {
      console.error('Error updating table position:', error);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e, table) => {
    e.preventDefault();
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDraggedTable(table);
    setDragOffset({
      x: x - table.x_position,
      y: y - table.y_position
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedTable) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Constrain to map boundaries
    const constrainedX = Math.max(0, Math.min(x, rect.width - 60));
    const constrainedY = Math.max(0, Math.min(y, rect.height - 60));

    setTables(prevTables => 
      prevTables.map(t => 
        t.id === draggedTable.id 
          ? { ...t, x_position: constrainedX, y_position: constrainedY }
          : t
      )
    );
  };

  const handleMouseUp = () => {
    if (draggedTable) {
      const updatedTable = tables.find(t => t.id === draggedTable.id);
      if (updatedTable) {
        updateTablePosition(draggedTable.id, updatedTable.x_position, updatedTable.y_position);
      }
    }
    setDraggedTable(null);
    setIsDragging(false);
  };

  // Get table status color
  const getTableStatusColor = (table) => {
    const hasOrders = table.current_order_count > 0;
    if (hasOrders) {
      return 'bg-red-500 border-red-600';
    }
    return table.location === 'indoor' 
      ? 'bg-blue-500 border-blue-600' 
      : 'bg-green-500 border-green-600';
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interaktivna Mapa Stolova</h2>
            <p className="text-gray-300">
              Prevucite stolove da ih premestite. Plavi stolovi su unutrašnji, zeleni su spoljašnji.
            </p>
          </div>
          <button
            onClick={() => {
              // Save current positions
              tables.forEach(table => {
                updateTablePosition(table.id, table.x_position, table.y_position);
              });
              alert('Raspored je sačuvan!');
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg font-semibold"
          >
            💾 Sačuvaj raspored
          </button>
        </div>

        {/* Map Container */}
        <div 
          ref={mapRef}
          className="relative bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden"
          style={{ width: '100%', height: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Bar representation */}
          <div className="absolute left-4 top-4 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold">
            Šank
          </div>

          {/* Tables */}
          {tables.map((table) => (
            <div
              key={table.id}
              className={`absolute w-12 h-12 rounded-lg border-2 cursor-move flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${
                getTableStatusColor(table)
              } ${isDragging && draggedTable?.id === table.id ? 'z-50 shadow-lg' : 'z-10'}`}
              style={{
                left: `${table.x_position}px`,
                top: `${table.y_position}px`,
                transform: isDragging && draggedTable?.id === table.id ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseDown={(e) => handleMouseDown(e, table)}
              title={`Sto ${table.table_number} - ${table.location === 'indoor' ? 'Unutrašnji' : 'Spoljašnji'}`}
            >
              {table.table_number}
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-gray-700 p-4 rounded-lg">
            <h4 className="text-white font-bold mb-2">Legenda:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded mr-2"></div>
                <span className="text-gray-300">Unutrašnji stolovi</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded mr-2"></div>
                <span className="text-gray-300">Spoljašnji stolovi</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded mr-2"></div>
                <span className="text-gray-300">Stolovi sa porudžbinama</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-bold mb-2">Uputstvo:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Kliknite i prevucite stolove da ih premestite</li>
            <li>• Pozicije se automatski čuvaju u bazi podataka</li>
            <li>• Crveni stolovi imaju aktivne porudžbine</li>
            <li>• Plavi stolovi su unutrašnji, zeleni su spoljašnji</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTableMap; 