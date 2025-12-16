/**
 * Search Bar Component
 * Real-time search with debouncing
 */

import React from 'react';

export const SearchBar = ({ value, onChange, placeholder = "Search by patient or doctor name..." }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-gray-500 text-xl">🔍</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-4 rounded-2xl backdrop-blur-xl bg-white/40 border-2 border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-lg font-medium"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="text-xl">✕</span>
        </button>
      )}
    </div>
  );
};
