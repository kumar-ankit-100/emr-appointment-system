/**
 * Calendar Widget Component
 * Date selection for filtering appointments
 * Healthcare design: intuitive, accessible
 */

import React, { useState } from 'react';

export const CalendarWidget = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(selected.toISOString().split('T')[0]);
  };

  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{monthName}</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 font-bold"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 font-bold"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateString =
            day && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              .toISOString()
              .split('T')[0];
          const isSelected = dateString === selectedDate;
          const isToday = dateString === todayDate;

          return (
            <button
              key={index}
              onClick={() => day && handleDateClick(day)}
              disabled={!day}
              className={`
                aspect-square rounded-lg font-medium transition-all duration-200
                ${
                  !day
                    ? 'cursor-default'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : isToday
                    ? 'bg-blue-100 text-blue-700 font-bold'
                    : 'text-gray-700 hover:bg-blue-50'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Clear selection */}
      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
};
