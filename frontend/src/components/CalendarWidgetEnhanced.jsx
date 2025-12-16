/**
 * Enhanced Calendar Widget with Heat Map
 * Shows appointment density with color intensity
 * Beautiful animations and hover effects
 */

import React, { useState, useEffect } from 'react';

export const CalendarWidget = ({ onDateSelect, selectedDate, appointments = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointmentCounts, setAppointmentCounts] = useState({});

  // Calculate appointment counts for each day
  useEffect(() => {
    const counts = {};
    appointments.forEach(apt => {
      const dateKey = new Date(apt.date).toDateString();
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    setAppointmentCounts(counts);
  }, [appointments]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      onDateSelect(selectedDate === dateString ? null : dateString);
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const dateString = date.toISOString().split('T')[0];
    return dateString === selectedDate;
  };

  const getAppointmentCount = (date) => {
    if (!date) return 0;
    return appointmentCounts[date.toDateString()] || 0;
  };

  // Get heat map color based on appointment count
  const getHeatMapColor = (count) => {
    if (count === 0) return '';
    if (count === 1) return 'bg-blue-100';
    if (count === 2) return 'bg-blue-200';
    if (count === 3) return 'bg-blue-300';
    if (count >= 4) return 'bg-blue-400';
    return '';
  };

  const getHeatMapBorder = (count) => {
    if (count === 0) return 'border-gray-200';
    if (count === 1) return 'border-blue-200';
    if (count === 2) return 'border-blue-300';
    if (count === 3) return 'border-blue-400';
    if (count >= 4) return 'border-blue-500';
    return 'border-gray-200';
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900"
          aria-label="Previous month"
        >
          <span className="text-xl">←</span>
        </button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900"
          aria-label="Next month"
        >
          <span className="text-xl">→</span>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const count = getAppointmentCount(date);
          const heatMapColor = getHeatMapColor(count);
          const heatMapBorder = getHeatMapBorder(count);
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!date}
              className={`
                relative aspect-square p-2 rounded-lg transition-all duration-200 text-sm font-medium
                ${!date ? 'invisible' : ''}
                ${date && !isSelected(date) ? 'hover:scale-110 hover:shadow-md' : ''}
                ${isToday(date) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isSelected(date)
                  ? 'bg-blue-600 text-white scale-110 shadow-lg'
                  : date
                  ? `${heatMapColor || 'bg-gray-50'} text-gray-700 border-2 ${heatMapBorder}`
                  : ''
                }
                ${date && !isSelected(date) ? 'hover:border-blue-400' : ''}
              `}
            >
              {date && (
                <>
                  <span className={`block ${count > 0 && !isSelected(date) ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </span>
                  {count > 0 && !isSelected(date) && (
                    <span className="absolute bottom-1 right-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Heat map legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">Appointment Traffic:</span>
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded"></div>
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-300 rounded"></div>
              <div className="w-4 h-4 bg-blue-300 border-2 border-blue-400 rounded"></div>
              <div className="w-4 h-4 bg-blue-400 border-2 border-blue-500 rounded"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {getAppointmentCount(new Date(selectedDate + 'T00:00'))} appointment(s)
              </p>
            </div>
            <button
              onClick={() => onDateSelect(null)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
