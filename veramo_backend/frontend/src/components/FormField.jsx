import React, { useState } from 'react';

const FormField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  icon,
  mask,
  options = [],
  isMulti = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseInputClasses = `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
    ${error 
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
      : isFocused 
        ? 'border-[#bfa15a] bg-white focus:border-[#bfa15a] focus:ring-[#bfa15a]/20' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }
    focus:outline-none focus:ring-4
    ${className}
  `;

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={baseInputClasses}
          required={required}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`${baseInputClasses} resize-none h-24`}
          required={required}
        />
      );
    }

    if (mask) {
      return (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={baseInputClasses}
          required={required}
          {...mask}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={baseInputClasses}
        required={required}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#23281a]">
        {icon && (
          <div className="w-5 h-5 text-[#bfa15a]">
            {icon}
          </div>
        )}
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {renderInput()}
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-red-500 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
