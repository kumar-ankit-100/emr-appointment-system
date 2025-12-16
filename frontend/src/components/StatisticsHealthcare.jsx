/**
 * Healthcare Statistics Cards
 * Clean design matching reference image
 */

import React, { useEffect, useState } from 'react';

export const StatisticsHealthcare = ({ appointments }) => {
  const [stats, setStats] = useState({
    today: 0,
    confirmed: 0,
    upcoming: 0,
    telemedicine: 0,
  });

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calculated = {
      today: appointments.filter(a => {
        const aptDate = new Date(a.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      }).length,
      confirmed: appointments.filter(a => a.status === 'Confirmed').length,
      upcoming: appointments.filter(a => a.status === 'Upcoming' || a.status === 'Scheduled').length,
      telemedicine: appointments.filter(a => a.mode === 'Online').length,
    };

    setStats(calculated);
  }, [appointments]);

  const cards = [
    {
      label: "Today's Appointments",
      value: stats.today,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      badge: 'Today',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Confirmed Appointments',
      value: stats.confirmed,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      badge: 'Confirmed',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      label: 'Upcoming Appointments',
      value: stats.upcoming,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      badge: 'Upcoming',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Telemedicine Sessions',
      value: stats.telemedicine,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      badge: 'Virtual',
      badgeColor: 'bg-pink-100 text-pink-700',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl p-5 border border-gray-200`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`text-4xl font-bold ${card.textColor}`}>
              {card.value}
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
};
