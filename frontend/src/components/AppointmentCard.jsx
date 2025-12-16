/**
 * Appointment Card Component
 * Individual appointment display with healthcare design
 * Features: status badges, mode indicator, status update action
 */

import React, { useState } from 'react';

const statusConfig = {
  Confirmed: {
    icon: '✓',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  Scheduled: {
    icon: '🕐',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  Upcoming: {
    icon: '!',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
  },
  Cancelled: {
    icon: '✕',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};

export const AppointmentCard = ({
  appointment,
  onStatusUpdate,
  isUpdating = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const config = statusConfig[appointment.status];
  const statusIcon = config.icon;

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    return new Date(`${dateString}T00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStatusChange = async (newStatus) => {
    setIsDropdownOpen(false);
    await onStatusUpdate(appointment.id, newStatus);
  };

  const validStatusTransitions = {
    Scheduled: ['Confirmed', 'Cancelled'],
    Confirmed: ['Scheduled', 'Cancelled'],
    Upcoming: ['Confirmed', 'Cancelled'],
    Cancelled: ['Scheduled', 'Confirmed'],
  };

  const availableTransitions = validStatusTransitions[appointment.status] || [];

  return (
    <div
      className={`
        rounded-2xl backdrop-blur-xl bg-white/40 border-2 border-white/30 shadow-xl transition-all duration-300 overflow-hidden
        hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/50
      `}
    >
      {/* Colored Top Border */}
      <div className={`h-3 bg-gradient-to-r ${config.badgeColor}`}></div>
      
      {/* Card Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {appointment.patientName}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span>👨‍⚕️</span>
              Dr. {appointment.doctorName}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.badgeColor} shadow-sm`}>
            <span className={`text-base ${config.textColor}`}>{statusIcon}</span>
            <span className={`text-sm font-bold ${config.textColor}`}>
              {appointment.status}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4 bg-gradient-to-br from-white to-gray-50">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <span>📅</span> Date
            </p>
            <p className="text-sm font-bold text-gray-900">
              {formatDate(appointment.date)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <span>⏰</span> Time
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatTime(appointment.time)} ({appointment.duration} min)
            </p>
          </div>
        </div>

        {/* Mode and Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Mode</p>
            <p className={`text-sm font-medium ${appointment.mode === 'Online' ? 'text-blue-600' : 'text-gray-700'}`}>
              {appointment.mode}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-700 truncate">
              {appointment.notes || 'No notes'}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer - Status Update */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isUpdating || availableTransitions.length === 0}
            className={`
              w-full py-2 px-3 rounded-lg font-medium transition-all duration-200
              text-sm flex items-center justify-between
              ${
                availableTransitions.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
              ${isUpdating ? 'opacity-50' : ''}
            `}
          >
            <span>{isUpdating ? 'Updating...' : 'Update Status'}</span>
            {availableTransitions.length > 0 && (
              <span className="text-lg leading-none">▼</span>
            )}
          </button>

          {/* Status Dropdown */}
          {isDropdownOpen && availableTransitions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {availableTransitions.map((status) => {
                const transitionConfig = statusConfig[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating}
                    className={`
                      w-full text-left px-4 py-3 transition-colors duration-200
                      hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                      border-b last:border-b-0
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${transitionConfig.badgeColor}`}></div>
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
