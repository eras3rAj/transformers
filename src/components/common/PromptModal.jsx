import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import '../layout/Layout.css';

const PromptModal = ({ isOpen, title, message, placeholder, onConfirm, onCancel, confirmText = 'Confirm', confirmType = 'primary' }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1200, backdropFilter: 'blur(4px)'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ 
            backgroundColor: confirmType === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
            padding: '1rem', borderRadius: '50%', display: 'inline-block' 
          }}>
            <AlertCircle size={32} color={confirmType === 'danger' ? 'var(--danger)' : 'var(--accent-primary)'} />
          </div>
        </div>
        
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{title}</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {message}
        </p>
        
        <input 
          type="text"
          className="input-field"
          placeholder={placeholder || 'Type here...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ width: '100%', marginBottom: '2rem' }}
          autoFocus
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            style={{ 
              flex: 1, 
              backgroundColor: confirmType === 'danger' ? 'var(--danger)' : 'var(--accent-primary)',
              borderColor: confirmType === 'danger' ? 'var(--danger)' : 'var(--accent-primary)'
            }}
            onClick={() => onConfirm(inputValue)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
