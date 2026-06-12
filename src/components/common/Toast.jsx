import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import './Toast.css';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast animate-slide-up toast-${type}`}>
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="toast-close"><X size={16} /></button>
    </div>
  );
};
