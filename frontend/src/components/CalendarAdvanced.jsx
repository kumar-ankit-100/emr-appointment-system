/**
 * Advanced Calendar Widget with Month/Day View Toggle
 * Features:
 * - Month view with heat map
 * - Day view showing hourly schedule
 * - Glassmorphism design
 * - Beautiful animations
 */

import React, { useState, useEffect } from 'react';

export const CalendarAdvanced = ({ onDateSelect, selectedDate, appointments = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'day'
  const [selectedDayView, setSelectedDayView] = useState(new Date());
  const [appointmentCounts, setAppointmentCounts] = useState({});

  // Calculate appointment counts for heat map
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getAppointmentsForDay = (date) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateString);
  };

  const getHourlySlots = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
      });
    }
    return hours;
  };

  const getAppointmentAtHour = (hour) => {
    const dayAppointments = getAppointmentsForDay(selectedDayView);
    return dayAppointments.find(apt => {
      const aptHour = parseInt(apt.time.split(':')[0]);
      return aptHour === hour;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDayView);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDayView(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDayView);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDayView(newDate);
  };

  const handleDateClick = (date) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      setSelectedDayView(date);
      onDateSelect(selectedDate === dateString ? null : dateString);
    }
  };

  const switchToDayView = (date) => {
    setSelectedDayView(date);
    setViewMode('day');
    const dateString = date.toISOString().split('T')[0];
    onDateSelect(dateString);
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

  const getHeatMapColor = (count) => {
    if (count === 0) return 'from-white/40 to-white/20';
    if (count === 1) return 'from-blue-100/60 to-blue-50/40';
    if (count === 2) return 'from-blue-200/70 to-blue-100/50';
    if (count === 3) return 'from-blue-300/80 to-blue-200/60';
    return 'from-blue-400/90 to-blue-300/70';
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative">
      {/* Glassmorphism Card */}
      <div className="relative backdrop-blur-xl bg-white/30 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10"></div>
        
        <div className="relative p-6">
          {/* Header with View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={viewMode === 'month' ? handlePrevMonth : handlePrevDay}
                className="p-2.5 rounded-xl backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 border border-white/30"
              >
                <span className="text-xl">←</span>
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {viewMode === 'month'
                    ? `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
                    : selectedDayView.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  {viewMode === 'month' ? 'Month View' : 'Day View'}
                </p>
              </div>
              
              <button
                onClick={viewMode === 'month' ? handleNextMonth : handleNextDay}
                className="p-2.5 rounded-xl backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 border border-white/30"
              >
                <span className="text-xl">→</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 backdrop-blur-md bg-white/40 rounded-xl p-1.5 border border-white/30 shadow-lg">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'month'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                📅 Month
              </button>
              <button
                onClick={() => {
                  setViewMode('day');
                  if (!selectedDate) {
                    setSelectedDayView(new Date());
                    onDateSelect(new Date().toISOString().split('T')[0]);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'day'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                📋 Day
              </button>
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <>
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider p-2 backdrop-blur-sm bg-white/20 rounded-lg"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  const count = getAppointmentCount(date);
                  const heatMapColor = getHeatMapColor(count);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => date && handleDateClick(date)}
                      onDoubleClick={() => date && switchToDayView(date)}
                      disabled={!date}
                      className={`
                        relative aspect-square p-3 rounded-xl transition-all duration-300 text-sm font-semibold
                        backdrop-blur-md border border-white/30
                        ${!date ? 'invisible' : ''}
                        ${date && !isSelected(date) ? 'hover:scale-110 hover:shadow-xl hover:z-10' : ''}
                        ${isToday(date) ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                        ${isSelected(date)
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-110 shadow-2xl z-20'
                          : date
                          ? `bg-gradient-to-br ${heatMapColor} text-gray-800`
                          : ''
                        }
                      `}
                      title={date ? `Double-click to view day schedule` : ''}
                    >
                      {date && (
                        <>
                          <span className="block">{date.getDate()}</span>
                          {count > 0 && !isSelected(date) && (
                            <span className="absolute bottom-1 right-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Heat Map Legend */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span className="font-semibold">Appointment Traffic:</span>
                  <div className="flex items-center gap-2">
                    <span>Less</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-lg backdrop-blur-md bg-gradient-to-br ${getHeatMapColor(i)} border border-white/30 shadow-sm`}
                        ></div>
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  💡 Double-click any date to view hourly schedule
                </p>
              </div>
            </>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {getHourlySlots().map(({ hour, label }) => {
                const appointment = getAppointmentAtHour(hour);
                const isCurrentHour = new Date().getHours() === hour && isToday(selectedDayView);
                
                return (
                  <div
                    key={hour}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all duration-200
                      ${isCurrentHour ? 'bg-yellow-100/60 border-2 border-yellow-400' : 'bg-white/30 border border-white/20'}
                      ${appointment ? 'hover:shadow-xl' : ''}
                    `}
                  >
                    <div className="w-20 text-right">
                      <span className={`text-sm font-bold ${isCurrentHour ? 'text-yellow-700' : 'text-gray-700'}`}>
                        {label}
                      </span>
                      {isCurrentHour && <div className="text-xs text-yellow-600">Now</div>}
                    </div>
                    
                    {appointment ? (
                      <div className="flex-1 p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-4 border-blue-500 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900">{appointment.name}</h4>
                            <p className="text-sm text-gray-600">👨‍⚕️ {appointment.doctorName}</p>
                          </div>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-bold
                            ${appointment.status === 'Confirmed' ? 'bg-green-100 text-green-700' : ''}
                            ${appointment.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' : ''}
                            ${appointment.status === 'Upcoming' ? 'bg-cyan-100 text-cyan-700' : ''}
                            ${appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>⏱️ {appointment.duration} min</span>
                          <span>📍 {appointment.mode}</span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-gray-600 mt-2 italic">"{appointment.notes}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 p-3 rounded-lg bg-white/10 border border-dashed border-gray-300">
                        <p className="text-xs text-gray-500 text-center">No appointment</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};
