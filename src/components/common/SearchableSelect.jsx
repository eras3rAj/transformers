import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, className, required, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize options to { value, label } format and sort them
  const normalizedOptions = React.useMemo(() => {
    let formatted = [];
    if (options && options.length > 0) {
      if (typeof options[0] === 'object' && options[0] !== null) {
        formatted = options.map(opt => ({ 
          value: opt.value !== undefined ? opt.value : opt.id, 
          label: opt.label || opt.name || opt.poNo || String(opt.value) 
        }));
      } else {
        formatted = options.map(opt => ({ value: opt, label: String(opt) }));
      }
    }
    
    // Sort options alphabetically by label
    return formatted.sort((a, b) => {
      const labelA = String(a.label).toLowerCase();
      const labelB = String(b.label).toLowerCase();
      if (labelA < labelB) return -1;
      if (labelA > labelB) return 1;
      return 0;
    });
  }, [options]);

  const filteredOptions = normalizedOptions.filter(opt => 
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  const handleSelect = (val) => {
    // Mimic the native event object structure for standard change handlers
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Hidden native input for required validation if needed */}
      {required && (
        <input 
          type="text" 
          required={required} 
          value={value || ''} 
          onChange={() => {}} 
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} 
        />
      )}
      
      <div 
        className={className || 'input-field'} 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'var(--bg-primary)',
          userSelect: 'none',
          marginBottom: 0
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '4px', 
          marginTop: '4px', 
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '300px'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input 
              type="text" 
              autoFocus 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                color: 'var(--text-primary)', 
                width: '100%', 
                outline: 'none',
                fontSize: '0.9rem'
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div style={{ overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value} 
                  onClick={() => handleSelect(opt.value)}
                  style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    backgroundColor: value === opt.value ? 'var(--accent-glow)' : 'transparent',
                    color: value === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === opt.value ? 'var(--accent-glow)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
