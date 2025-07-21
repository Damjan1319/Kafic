import React from 'react';

// Demo raspored: 12 unutra, 18 bašta
const INDOOR_TABLES = [
  { id: 1, x: 1, y: 1 }, { id: 2, x: 2, y: 1 }, { id: 3, x: 3, y: 1 },
  { id: 4, x: 1, y: 2 }, { id: 5, x: 2, y: 2 }, { id: 6, x: 3, y: 2 },
  { id: 7, x: 1, y: 3 }, { id: 8, x: 2, y: 3 }, { id: 9, x: 3, y: 3 },
  { id: 10, x: 1, y: 4 }, { id: 11, x: 2, y: 4 }, { id: 12, x: 3, y: 4 },
];
const OUTDOOR_TABLES = [
  { id: 13, x: 5, y: 1 }, { id: 14, x: 6, y: 1 }, { id: 15, x: 7, y: 1 },
  { id: 16, x: 5, y: 2 }, { id: 17, x: 6, y: 2 }, { id: 18, x: 7, y: 2 },
  { id: 19, x: 5, y: 3 }, { id: 20, x: 6, y: 3 }, { id: 21, x: 7, y: 3 },
  { id: 22, x: 5, y: 4 }, { id: 23, x: 6, y: 4 }, { id: 24, x: 7, y: 4 },
  { id: 25, x: 5, y: 5 }, { id: 26, x: 6, y: 5 }, { id: 27, x: 7, y: 5 },
  { id: 28, x: 5, y: 6 }, { id: 29, x: 6, y: 6 }, { id: 30, x: 7, y: 6 },
];

const TableMapDemo = () => {
  // Kombinuj sve stolove
  const allTables = [
    ...INDOOR_TABLES.map(t => ({ ...t, location: 'indoor' })),
    ...OUTDOOR_TABLES.map(t => ({ ...t, location: 'outdoor' })),
  ];

  // Grid dimenzije
  const gridCols = 8;
  const gridRows = 7;

  // Helper za prikaz stola
  const renderTable = (table) => (
    <div
      key={table.id}
      style={{ gridColumn: table.x, gridRow: table.y }}
      className={`flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg text-xs font-bold
        ${table.location === 'indoor' ? 'bg-blue-700/80 border-4 border-blue-400 text-white' : 'bg-green-700/80 border-4 border-green-400 text-white'}
        hover:scale-110 transition-transform duration-200 cursor-pointer select-none`}
      title={table.location === 'indoor' ? 'Kafić' : 'Bašta'}
    >
      <span className="text-lg">{table.id}</span>
      <span className="text-[10px] mt-1">{table.location === 'indoor' ? 'Kafić' : 'Bašta'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-6">Demo: Raspored stolova u odnosu na šank</h1>
        <div className="relative bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          {/* Šank */}
          <div
            className="absolute left-0 top-0 h-full w-16 bg-yellow-400/80 rounded-l-2xl flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg"
            style={{ zIndex: 1 }}
          >
            ŠANK
          </div>
          {/* Mapa stolova */}
          <div
            className="grid gap-4 ml-20"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 3.5rem)`,
              gridTemplateRows: `repeat(${gridRows}, 3.5rem)`
            }}
          >
            {allTables.map(renderTable)}
          </div>
        </div>
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Plavi stolovi = kafić, Zeleni = bašta. Šank je levo. Raspored je samo primer.</p>
        </div>
      </div>
    </div>
  );
};

export default TableMapDemo; 