/**
 * Welcome Modal
 * Shows feature overview on first visit
 */

import React, { useState, useEffect } from 'react';

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal only on first visit
    const hasVisited = localStorage.getItem('swasthiq_visited');
    if (!hasVisited) {
      setIsOpen(true);
      localStorage.setItem('swasthiq_visited', 'true');
    }
  }, []);

  if (!isOpen) return null;

  const features = [
    {
      icon: '📅',
      title: 'Heat Map Calendar',
      description: 'Visual appointment density - darker colors mean more appointments!'
    },
    {
      icon: '🔍',
      title: 'Smart Search',
      description: 'Search patients and doctors instantly as you type'
    },
    {
      icon: '📊',
      title: 'Live Statistics',
      description: 'Animated dashboard showing key metrics at a glance'
    },
    {
      icon: '⚡',
      title: 'Quick Actions',
      description: 'Click the lightning button (bottom-right) for shortcuts'
    },
    {
      icon: '📥',
      title: 'CSV Export',
      description: 'Export filtered appointments to CSV with one click'
    },
    {
      icon: '🎨',
      title: 'Modern UI',
      description: 'Beautiful animations, gradients, and smooth transitions'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🏥 Welcome to SwasthiQ EMR!</h1>
          <p className="text-blue-100 text-lg">
            Healthcare Appointment Management System
          </p>
        </div>

        {/* Features Grid */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ✨ Standout Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-md transition-all duration-200"
              >
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-900 mb-2">💡 Quick Tips:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Click calendar dates to filter appointments</li>
              <li>• Use tabs (Upcoming/Today/Past) to switch time periods</li>
              <li>• Click "Update Status" on cards to change appointment status</li>
              <li>• Combine filters for powerful search capabilities</li>
              <li>• Watch for animated counters and smooth transitions</li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started →
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Built with React, Flask, PostgreSQL • Production-Ready Architecture
          </p>
        </div>
      </div>
    </div>
  );
};
