/**
 * Healthcare Calendar with Monthly/Weekly View Toggle
 * Color-based heat map without numbers, matching reference design
 */

import React, { useState, useEffect } from 'react';

export const CalendarHealthcare = ({ onDateSelect, selectedDate, appointments = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', or 'day'
  const [appointmentCounts, setAppointmentCounts] = useState({});
  const [statusByDate, setStatusByDate] = useState({});

  useEffect(() => {
    const counts = {};
    const statuses = {};
    
    // Only count non-cancelled appointments for heat map
    appointments.forEach(apt => {
      if (apt.status !== 'Cancelled') {
        const dateKey = apt.date;
        counts[dateKey] = (counts[dateKey] || 0) + 1;
        
        if (!statuses[dateKey]) {
          statuses[dateKey] = [];
        }
        statuses[dateKey].push(apt.status);
      }
    });
    
    console.log('Appointment counts (excluding cancelled):', counts);
    console.log('Status by date:', statuses);
    
    setAppointmentCounts(counts);
    setStatusByDate(statuses);
  }, [appointments]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      onDateSelect(dateString);
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return dateString === selectedDate;
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return dateString === selectedDate;
  };

  const getDateColor = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const count = appointmentCounts[dateString] || 0;

    console.log(`Date: ${dateString}, Count: ${count}`);

    if (count === 0) return '';
    
    // Heat map: darker color = more appointments (excluding cancelled)
    if (count === 1) {
      return 'bg-blue-100'; // Lightest - 1 appointment
    } else if (count === 2) {
      return 'bg-blue-200'; // Light - 2 appointments
    } else if (count === 3) {
      return 'bg-blue-300'; // Medium - 3 appointments
    } else if (count === 4) {
      return 'bg-blue-400 text-white'; // Dark - 4 appointments
    } else {
      return 'bg-blue-500 text-white'; // Darkest - 5+ appointments
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Calendar</h3>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            onDateSelect(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Today
        </button>
      </div>

      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevPeriod}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <span className="text-gray-600">‹</span>
        </button>
        
        <div className="text-sm font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        
        <button
          onClick={handleNextPeriod}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <span className="text-gray-600">›</span>
        </button>
      </div>



      {/* Day Names */}
      <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-1 mb-2`}>
        {dayNames.map((day, index) => (
          <div
            key={`day-${index}`}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-1`}>
        {days.map((date, index) => {
          const dateColor = getDateColor(date);
          const selected = isSelectedDate(date);
          const today = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!date}
              className={`
                aspect-square p-2 text-sm font-medium rounded-lg transition-all
                ${!date ? 'invisible' : ''}
                ${today && !selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                ${selected
                  ? 'bg-blue-600 text-white shadow-lg'
                  : date && dateColor
                  ? `${dateColor} text-gray-700 hover:shadow-md`
                  : date
                  ? 'bg-white text-gray-700 hover:shadow-md'
                  : ''
                }
              `}
            >
              {date && date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div>
          <span className="text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-gray-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></div>
          <span className="text-gray-600">Cancelled</span>
        </div>
      </div>
    </div>
  );
};
