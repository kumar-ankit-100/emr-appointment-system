/**
 * Healthcare Appointment Card
 * Clean design with working status dropdown, patient avatars, and all reference features
 */

import React, { useState, useRef, useEffect } from 'react';

export const AppointmentCardHealthcare = ({ appointment, onStatusUpdate, onEdit, onDelete }) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const statusOptions = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
      Confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      Completed: 'bg-purple-100 text-purple-700 border-purple-300',
      Cancelled: 'bg-rose-100 text-rose-700 border-rose-300',
      'No Show': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getAppointmentTypeFromNotes = (notes) => {
    if (!notes) return 'General';
    const lowerNotes = notes.toLowerCase();
    if (lowerNotes.includes('checkup') || lowerNotes.includes('check-up')) return 'Check-up';
    if (lowerNotes.includes('follow')) return 'Follow-up';
    if (lowerNotes.includes('consultation')) return 'Consultation';
    if (lowerNotes.includes('emergency')) return 'Emergency';
    if (lowerNotes.includes('dental')) return 'Dental';
    if (lowerNotes.includes('examination')) return 'Examination';
    return 'Consultation';
  };

  const getAppointmentTypeColor = (type) => {
    const colors = {
      'Follow-up': 'bg-blue-50 text-blue-600',
      'Consultation': 'bg-purple-50 text-purple-600',
      'Check-up': 'bg-green-50 text-green-600',
      'Emergency': 'bg-red-50 text-red-600',
      'Dental': 'bg-orange-50 text-orange-600',
      'Examination': 'bg-teal-50 text-teal-600',
      'General': 'bg-gray-50 text-gray-600',
    };
    return colors[type] || 'bg-gray-50 text-gray-600';
  };

  const getModeIcon = (mode) => {
    return mode === 'Online' ? '💻' : '🏥';
  };

  const getPatientInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleStatusChange = (newStatus) => {
    onStatusUpdate(appointment.id, newStatus);
    setShowStatusDropdown(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Patient Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-base">
            {getPatientInitials(appointment.name)}
          </div>
          
          {/* Patient Info */}
          <div>
            <div className="font-semibold text-gray-900 text-base">
              {appointment.name}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>{getModeIcon(appointment.mode)}</span>
              <span>{appointment.mode}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(appointment.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Appointment Details */}
      <div className="space-y-3">
        {/* Doctor */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-600">{appointment.doctorName}</span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600">
            {new Date(appointment.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })} at {formatTime(appointment.time)}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-600">{appointment.duration} minutes</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        {/* Appointment Type */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${getAppointmentTypeColor(getAppointmentTypeFromNotes(appointment.notes))}`}>
            {getAppointmentTypeFromNotes(appointment.notes)}
          </span>
        </div>

        {/* Status Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${getStatusColor(appointment.status)} hover:shadow-md`}
          >
            {appointment.status}
            <span className="ml-1">▼</span>
          </button>

          {/* Dropdown Menu */}
          {showStatusDropdown && (
            <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    appointment.status === status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
