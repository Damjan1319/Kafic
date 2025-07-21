import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QRScanner = () => {
  const [qrCode, setQrCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (qrCode.trim()) {
      navigate(`/menu/${qrCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="card shadow-lg">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-primary mb-2">QR Skener Test</h1>
            <p className="text-secondary mb-1">QR Scanner Test</p>
            <p className="text-secondary">Unesite QR kod za testiranje</p>
            <p className="text-secondary text-xs">Enter QR code for testing</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">QR Kod</label>
                <p className="text-xs opacity-75">QR Code</p>
                <input
                  type="text"
                  className="form-input"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="npr. TABLE_001 (e.g. TABLE_001)"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Otvori meni
              <span className="block text-xs opacity-75">Open Menu</span>
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-secondary">
              <p className="mb-2 font-medium">Test QR kodovi:</p>
              <p className="text-xs opacity-75">Test QR codes:</p>
              <div className="space-y-1">
                <button 
                  onClick={() => navigate('/menu/TABLE_001')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_001 (Sto 1)
                  <span className="block text-xs opacity-75">TABLE_001 (Table 1)</span>
                </button>
                <button 
                  onClick={() => navigate('/menu/TABLE_002')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_002 (Sto 2)
                  <span className="block text-xs opacity-75">TABLE_002 (Table 2)</span>
                </button>
                <button 
                  onClick={() => navigate('/menu/TABLE_003')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_003 (Sto 3)
                  <span className="block text-xs opacity-75">TABLE_003 (Table 3)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 