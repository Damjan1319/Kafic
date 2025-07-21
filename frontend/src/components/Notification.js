import React, { useEffect, useState } from 'react';

const Notification = ({ message, type = 'info', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    if (duration > 0) {
      const timer = setTimeout(() => {
        // Animate out
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-gradient-to-r from-emerald-500/95 to-emerald-600/95 border-emerald-400 text-white shadow-emerald-500/25',
          icon: 'bg-emerald-400/20 text-emerald-100',
          closeButton: 'text-emerald-100 hover:text-white hover:bg-emerald-400/20'
        };
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-500/95 to-red-600/95 border-red-400 text-white shadow-red-500/25',
          icon: 'bg-red-400/20 text-red-100',
          closeButton: 'text-red-100 hover:text-white hover:bg-red-400/20'
        };
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-yellow-500/95 to-yellow-600/95 border-yellow-400 text-white shadow-yellow-500/25',
          icon: 'bg-yellow-400/20 text-yellow-100',
          closeButton: 'text-yellow-100 hover:text-white hover:bg-yellow-400/20'
        };
      default:
        return {
          container: 'bg-gradient-to-r from-blue-500/95 to-blue-600/95 border-blue-400 text-white shadow-blue-500/25',
          icon: 'bg-blue-400/20 text-blue-100',
          closeButton: 'text-blue-100 hover:text-white hover:bg-blue-400/20'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Uspešno!';
      case 'error':
        return 'Greška!';
      case 'warning':
        return 'Upozorenje!';
      default:
        return 'Informacija';
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div 
        className={`
          flex items-start space-x-4 p-4 rounded-xl border-2 backdrop-blur-md shadow-2xl
          transform transition-all duration-300 ease-out
          ${styles.container}
          ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[-100%] opacity-0 scale-95'}
        `}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.icon}`}>
          <span className="text-lg">{getIcon()}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold uppercase tracking-wide">
              {getTitle()}
            </h4>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 300);
              }}
              className={`p-1 rounded-full transition-all duration-200 ${styles.closeButton}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-white/40 transition-all duration-300 ease-linear"
              style={{ 
                width: isVisible ? '100%' : '0%',
                transition: `width ${duration}ms linear`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification; 