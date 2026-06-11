import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'text', count = 1, style = {} }) => {
  const elements = Array(count).fill(0);
  
  if (type === 'card') {
    return (
      <div className="skeleton-wrapper skeleton-card" style={style}>
        {elements.map((_, i) => (
          <div key={i} className="skeleton-item"></div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="skeleton-wrapper skeleton-table" style={style}>
        {elements.map((_, i) => (
          <div key={i} className="skeleton-item"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`skeleton-wrapper skeleton-${type}`} style={style}>
      {elements.map((_, i) => (
        <div key={i} className="skeleton-item" style={{ opacity: 1 - (i * 0.15) }}></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
