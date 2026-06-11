import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DynamicMetric = ({ 
  value, 
  previousValue = null, 
  format = 'number', 
  inverse = false, 
  prefix = '', 
  suffix = '',
  size = 'medium' 
}) => {
  
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : Number(value);
  const prevNumeric = previousValue !== null ? (typeof previousValue === 'string' ? parseFloat(previousValue.replace(/[^0-9.-]+/g,"")) : Number(previousValue)) : numericValue;
  
  const diff = numericValue - prevNumeric;
  const percentChange = prevNumeric !== 0 ? (diff / prevNumeric) * 100 : 0;
  
  // Logic: 
  // If inverse is false: Higher is better (Green up arrow, Red down arrow)
  // If inverse is true: Lower is better (Green down arrow, Red up arrow)
  let status = 'neutral';
  if (diff > 0) status = inverse ? 'danger' : 'success';
  else if (diff < 0) status = inverse ? 'success' : 'danger';

  const formatValue = (val) => {
    if (format === 'currency') return `${prefix}₹${val.toLocaleString()}${suffix}`;
    if (format === 'percent') return `${prefix}${val.toFixed(1)}%${suffix}`;
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const colorVar = `var(--${status === 'neutral' ? 'text-muted' : status})`;
  
  const sizeStyles = {
    small: { value: '1.2rem', change: '0.75rem', icon: 14 },
    medium: { value: '1.8rem', change: '0.85rem', icon: 16 },
    large: { value: '2.5rem', change: '1rem', icon: 20 },
  };

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <span style={{ 
        fontSize: sizeStyles[size].value, 
        fontWeight: 'bold', 
        color: 'var(--text-primary)',
        transition: 'color 0.3s ease'
      }}>
        {formatValue(numericValue)}
      </span>
      
      {previousValue !== null && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px', 
          fontSize: sizeStyles[size].change, 
          color: colorVar,
          fontWeight: '600',
          backgroundColor: status !== 'neutral' ? `rgba(${status === 'success' ? '34,197,94' : '239,68,68'}, 0.1)` : 'transparent',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          <Icon size={sizeStyles[size].icon} />
          {Math.abs(percentChange).toFixed(1)}%
        </span>
      )}
    </div>
  );
};

export default DynamicMetric;
