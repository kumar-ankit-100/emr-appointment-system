/**
 * Statistics Card Component
 * Displays appointment statistics with animated counters
 */

import React, { useEffect, useState } from 'react';

export const StatisticsCard = ({ appointments }) => {
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    confirmed: 0,
    scheduled: 0,
    cancelled: 0,
    today: 0,
  });

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'Confirmed').length,
      scheduled: appointments.filter(a => a.status === 'Scheduled').length,
      cancelled: appointments.filter(a => a.status === 'Cancelled').length,
      today: appointments.filter(a => {
        const aptDate = new Date(a.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      }).length,
    };

    // Animate numbers
    const duration = 1000;
    const steps = 50;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        total: Math.floor(stats.total * progress),
        confirmed: Math.floor(stats.confirmed * progress),
        scheduled: Math.floor(stats.scheduled * progress),
        cancelled: Math.floor(stats.cancelled * progress),
        today: Math.floor(stats.today * progress),
      });

      if (step >= steps) {
        setAnimatedStats(stats);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [appointments]);

  const statCards = [
    {
      label: 'Total Appointments',
      value: animatedStats.total,
      icon: '📋',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Today',
      value: animatedStats.today,
      icon: '📅',
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
    },
    {
      label: 'Confirmed',
      value: animatedStats.confirmed,
      icon: '✅',
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600',
    },
    {
      label: 'Scheduled',
      value: animatedStats.scheduled,
      icon: '🕐',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
    },
    {
      label: 'Cancelled',
      value: animatedStats.cancelled,
      icon: '❌',
      color: 'from-red-500 to-rose-500',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/30 overflow-hidden"
        >
          <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl transform hover:scale-125 transition-transform duration-200">{stat.icon}</span>
              <span className={`text-3xl font-bold ${stat.textColor} drop-shadow-lg`}>
                {stat.value}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
};
