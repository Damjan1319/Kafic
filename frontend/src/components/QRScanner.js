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
            <h1 className="text-2xl font-bold text-primary mb-2">QR Scanner Test</h1>
            <p className="text-secondary">Unesite QR kod za testiranje</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">QR Kod</label>
                <input
                  type="text"
                  className="form-input"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="npr. TABLE_001"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Otvori meni
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-secondary">
              <p className="mb-2 font-medium">Test QR kodovi:</p>
              <div className="space-y-1">
                <button 
                  onClick={() => navigate('/menu/TABLE_001')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_001 (Sto 1)
                </button>
                <button 
                  onClick={() => navigate('/menu/TABLE_002')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_002 (Sto 2)
                </button>
                <button 
                  onClick={() => navigate('/menu/TABLE_003')}
                  className="block w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  TABLE_003 (Sto 3)
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