import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = "No Data Found", 
  message = "There's nothing here yet. Check back later or create a new record.", 
  actionLabel, 
  onAction 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '12px',
      border: '1px dashed var(--border-color)',
      margin: '1rem 0'
    }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        backgroundColor: 'var(--bg-secondary)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '1.5rem',
        color: 'var(--text-muted)'
      }}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{title}</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.5' }}>
        {message}
      </p>
      
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ padding: '0.6rem 1.5rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
