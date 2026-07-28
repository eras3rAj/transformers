import React from 'react';
import ReactDatePickerRaw from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Safely unwrap the default export to handle ESM interop issues in Vite/Rolldown
const ReactDatePicker = typeof ReactDatePickerRaw === 'function' 
  ? ReactDatePickerRaw 
  : (ReactDatePickerRaw.default || ReactDatePickerRaw);

const DatePicker = ({ value, onChange, name, placeholder = "dd/mm/yyyy", className = "input-field", required = false, readOnly = false, style = {} }) => {
  // Convert standard HTML string yyyy-mm-dd to Date object for react-datepicker
  const selectedDate = value ? new Date(value) : null;

  const handleChange = (date) => {
    // Convert Date object back to standard yyyy-mm-dd string for existing handlers
    const syntheticEvent = {
      target: {
        name,
        value: date ? date.toLocaleDateString('en-CA') : '' // en-CA outputs yyyy-mm-dd
      }
    };
    if (onChange) onChange(syntheticEvent);
  };

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      className={className}
      required={required}
      readOnly={readOnly}
      wrapperClassName="w-full"
      customInput={
        <input 
          style={{ 
            ...style, 
            width: '100%', 
            cursor: readOnly ? 'default' : 'pointer'
          }} 
        />
      }
    />
  );
};

export default DatePicker;
