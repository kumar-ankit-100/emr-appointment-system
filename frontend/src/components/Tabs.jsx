/**
 * Tabs Component
 * Navigation tabs for filtering appointments by time period
 * Healthcare design: calm blues/greens, clear visual hierarchy
 */

import React from 'react';

export const Tabs = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex gap-2 mb-6 backdrop-blur-xl bg-white/40 rounded-2xl p-2 shadow-xl border border-white/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 px-6 py-4 font-bold transition-all duration-300 rounded-xl
            flex items-center justify-center gap-2
            ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl transform scale-105 border-2 border-white/50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-white/60 backdrop-blur-sm'
            }
          `}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
