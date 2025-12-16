/**
 * Day View Calendar Component
 * Shows hourly timeline with appointment blocks like Google Calendar
 */

import React, { useState, useEffect } from 'react';

export const DayViewCalendar = ({ selectedDate, appointments = [], onAppointmentClick }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [dayAppointments, setDayAppointments] = useState([]);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const filtered = appointments.filter(apt => apt.date === dateStr);
    setDayAppointments(filtered);
  }, [currentDate, appointments]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  const getAppointmentPosition = (time, duration) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = (hours - 7) * 60 + minutes;
    const top = (startMinutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    return { top: `${top}px`, height: `${height}px` };
  };

  const detectOverlaps = (appointments) => {
    const sorted = [...appointments].sort((a, b) => {
      const aTime = a.time.split(':').map(Number);
      const bTime = b.time.split(':').map(Number);
      return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
    });

    const layout = [];
    sorted.forEach((apt) => {
      const [hours, minutes] = apt.time.split(':').map(Number);
      const start = hours * 60 + minutes;
      const end = start + apt.duration;

      // Find which column this appointment should go in
      let column = 0;
      let maxColumns = 1;

      for (let i = 0; i < layout.length; i++) {
        const other = layout[i];
        const [otherHours, otherMinutes] = other.time.split(':').map(Number);
        const otherStart = otherHours * 60 + otherMinutes;
        const otherEnd = otherStart + other.duration;

        // Check if overlaps
        if (start < otherEnd && end > otherStart) {
          if (other.column === column) {
            column++;
          }
          maxColumns = Math.max(maxColumns, column + 1);
        }
      }

      layout.push({ ...apt, column, totalColumns: maxColumns });
    });

    // Update totalColumns for all overlapping appointments
    layout.forEach((apt, i) => {
      const [hours, minutes] = apt.time.split(':').map(Number);
      const start = hours * 60 + minutes;
      const end = start + apt.duration;

      let maxCols = apt.totalColumns;
      layout.forEach((other) => {
        const [otherHours, otherMinutes] = other.time.split(':').map(Number);
        const otherStart = otherHours * 60 + otherMinutes;
        const otherEnd = otherStart + other.duration;

        if (start < otherEnd && end > otherStart) {
          maxCols = Math.max(maxCols, other.totalColumns);
        }
      });
      apt.totalColumns = maxCols;
    });

    return layout;
  };

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'bg-blue-500',
      Confirmed: 'bg-emerald-500',
      Completed: 'bg-purple-500',
      Cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Day View</h3>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-sm font-medium text-gray-900 min-w-[280px] text-center">
            {formatDateHeader(currentDate)}
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative" style={{ height: '600px', overflowY: 'auto' }}>
        <div className="relative">
          {/* Time Labels and Grid Lines */}
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="flex border-b border-gray-100"
              style={{ height: '80px' }}
            >
              <div className="w-20 flex-shrink-0 pr-4 pt-1 text-right">
                <span className="text-xs font-medium text-gray-500">{formatHour(hour)}</span>
              </div>
              <div className="flex-1 relative">
                {/* Grid line */}
                <div className="absolute inset-0 border-l border-gray-200"></div>
              </div>
            </div>
          ))}

          {/* Appointments */}
          <div className="absolute left-20 right-0 top-0" style={{ height: `${hours.length * 80}px` }}>
            {detectOverlaps(dayAppointments).map((appointment) => {
              const position = getAppointmentPosition(appointment.time, appointment.duration);
              const statusColor = getStatusColor(appointment.status);
              const columnWidth = 100 / appointment.totalColumns;
              const leftPosition = appointment.column * columnWidth;
              
              return (
                <div
                  key={appointment.id}
                  className={`absolute rounded-lg p-3 hover:shadow-lg transition-all ${statusColor} text-white overflow-hidden group`}
                  style={{
                    top: position.top,
                    height: position.height,
                    minHeight: '60px',
                    left: `${leftPosition}%`,
                    width: `${columnWidth - 1}%`
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-1 truncate">
                        {appointment.name}
                      </div>
                      <div className="text-xs opacity-90 truncate">
                        {appointment.doctorName}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {appointment.time} • {appointment.duration}min
                      </div>
                      <div className="text-xs opacity-90 mt-1 truncate">
                        {appointment.notes}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick({ action: 'edit', appointment });
                        }}
                        className="p-1.5 bg-white/30 hover:bg-white/40 rounded transition-colors shadow-sm"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick({ action: 'delete', appointment });
                        }}
                        className="p-1.5 bg-white/30 hover:bg-white/40 rounded transition-colors shadow-sm"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {dayAppointments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm text-gray-500">No appointments scheduled for this day</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
