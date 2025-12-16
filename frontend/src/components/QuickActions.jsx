/**
 * Quick Actions Panel
 * Floating action button with quick shortcuts
 */

import React, { useState } from 'react';

export const QuickActions = ({ onRefresh, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'refresh', label: 'Refresh', icon: '🔄', action: onRefresh },
    { id: 'clear', label: 'Clear Filters', icon: '✨', action: onClearFilters },
    { id: 'help', label: 'Help', icon: '❓', action: () => alert('SwasthiQ EMR Help:\n\n- Click calendar dates to filter\n- Use search to find patients\n- Update status via dropdown\n- Export data to CSV') },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border-2 border-white/30 p-2 mb-2 animate-fadeIn">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                action.action();
                setIsOpen(false);
              }}
              className="w-full px-5 py-3 hover:bg-white/60 rounded-xl transition-all duration-200 flex items-center gap-3 text-left backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-bold text-gray-800">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center backdrop-blur-xl border-2 border-white/30 transform hover:scale-110 ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        <span className="text-3xl">{isOpen ? '✕' : '⚡'}</span>
      </button>
    </div>
  );
};
