/**
 * Healthcare Appointment Management - Main View
 * Matches reference design with healthcare blue theme and glassmorphism
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentCardHealthcare } from './AppointmentCardHealthcare';
import { CalendarHealthcare } from './CalendarHealthcare';
import { DayViewCalendar } from './DayViewCalendar';
import { StatisticsHealthcare } from './StatisticsHealthcare';
import {
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  updateAppointment,
  createAppointment,
  healthCheck,
} from '../services/appointmentApi';

export const AppointmentManagementView = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  const [activeTab, setActiveTab] = useState('upcoming');
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    name: '',
    phoneNumber: '',
    doctorName: '',
    appointmentType: '',
    date: '',
    time: '',
    duration: '30',
    mode: 'In-Person',
    notes: ''
  });

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'today', label: 'Today' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
  ];

  const initialize = async () => {
    try {
      await healthCheck();
      setDbConnected(true);
      await fetchAppointments();
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to connect to server');
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Don't filter by date when fetching - we need all appointments for calendar
      const filters = {};

      const response = await getAppointments(filters);

      console.log('API Response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Fetched appointments count:', response.data.length);
        console.log('Sample appointment:', response.data[0]);
        setAppointments(response.data);
      } else {
        console.error('Failed to fetch appointments:', response);
        setError('Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Error fetching appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (dbConnected) {
      fetchAppointments();
    }
  }, [fetchAppointments, dbConnected]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = appointments;

    // If in list view and a date is selected, show only that date's appointments
    if (!showDayView && selectedDate && selectedDate !== todayString) {
      filtered = appointments.filter((apt) => apt.date === selectedDate);
    } else {
      // Tab filter
      if (activeTab === 'today') {
        filtered = appointments.filter((apt) => {
          const aptDate = new Date(apt.date + 'T00:00');
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        });
      } else if (activeTab === 'upcoming') {
        filtered = appointments.filter((apt) => {
          const aptDate = new Date(apt.date + 'T00:00');
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() >= today.getTime();
        });
      } else if (activeTab === 'past') {
        filtered = appointments.filter((apt) => {
          const aptDate = new Date(apt.date + 'T00:00');
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() < today.getTime();
        });
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.doctorName === doctorFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.name.toLowerCase().includes(query) ||
          apt.doctorName.toLowerCase().includes(query)
      );
    }

    console.log('Filtered appointments:', filtered.length, 'from', appointments.length);
    setFilteredAppointments(filtered);
  }, [appointments, activeTab, searchQuery, statusFilter, doctorFilter, showDayView, selectedDate, todayString]);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId);
      const response = await updateAppointmentStatus(appointmentId, newStatus);

      if (response.success) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return;

    try {
      const response = await deleteAppointment(deletingAppointment.id);

      if (response.success) {
        setAppointments((prev) => prev.filter((apt) => apt.id !== deletingAppointment.id));
        setShowDeleteConfirm(false);
        setDeletingAppointment(null);
        showNotification('Appointment deleted successfully!', 'success');
      } else {
        showNotification(response.message || 'Failed to delete appointment', 'error');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      showNotification('Failed to delete appointment', 'error');
    }
  };

  const handleEditAppointment = async (appointmentData) => {
    if (!editingAppointment) return;

    try {
      const response = await updateAppointment(editingAppointment.id, appointmentData);

      if (response.success) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === editingAppointment.id ? response.data : apt
          )
        );
        setShowEditModal(false);
        setEditingAppointment(null);
        showNotification('Appointment updated successfully!', 'success');
      } else {
        showNotification(response.message || 'Failed to update appointment', 'error');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      showNotification('Failed to update appointment', 'error');
    }
  };

  const handleAppointmentAction = (data) => {
    if (!data) return;

    if (data.action === 'edit') {
      setEditingAppointment(data.appointment);
      setShowEditModal(true);
    } else if (data.action === 'delete') {
      setDeletingAppointment(data.appointment);
      setShowDeleteConfirm(true);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      const response = await createAppointment(appointmentData);

      if (response.success) {
        setAppointments((prev) => [...prev, response.data]);
        setShowNewAppointmentModal(false);
        showNotification('Appointment created successfully!', 'success');
        fetchAppointments(); // Refresh list
      } else {
        showNotification(response.message || 'Failed to create appointment', 'error');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      showNotification('Failed to create appointment', 'error');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Patient Name', 'Doctor Name', 'Date', 'Time', 'Status', 'Mode', 'Duration'],
      ...filteredAppointments.map(apt => [
        apt.name,
        apt.doctorName,
        apt.date,
        apt.time,
        apt.status,
        apt.mode,
        apt.duration,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueDoctors = [...new Set(appointments.map(apt => apt.doctorName))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Appointment Management</h1>
              <p className="text-sm text-gray-500 mt-1">Schedule and manage patient appointments</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <span>↓</span>
                Export
              </button>
              <button 
                onClick={() => {
                  // Pre-fill date with selected date or today
                  setNewAppointmentForm(prev => ({
                    ...prev,
                    date: selectedDate || todayString
                  }));
                  setShowNewAppointmentModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                + New Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics */}
        <StatisticsHealthcare appointments={appointments} />

        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Calendar Sidebar */}
          <div className="col-span-3">
            {/* Day View Toggle - Above Calendar */}
            {selectedDate && (
              <button
                onClick={() => {
                  setShowDayView(!showDayView);
                  // When switching to list view, filter by selected date instead of resetting to today
                  if (showDayView) {
                    setActiveTab('all');
                  }
                }}
                className="w-full mb-4 px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span className="text-lg">{showDayView ? '📋' : '📅'}</span>
                {showDayView ? 'Show List View' : 'Show Day View'}
              </button>
            )}
            
            <CalendarHealthcare
              onDateSelect={(date) => {
                setSelectedDate(date);
                if (date) {
                  setShowDayView(true);
                }
              }}
              selectedDate={selectedDate}
              appointments={appointments}
            />
          </div>

          {/* Appointments List or Day View */}
          <div className="col-span-9">
            {/* Tabs and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Doctors</option>
                  {uniqueDoctors.map((doctor) => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Day View or Appointments Grid */}
            {showDayView && selectedDate ? (
              <DayViewCalendar
                selectedDate={selectedDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentAction}
              />
            ) : loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCardHealthcare
                    key={appointment.id}
                    appointment={appointment}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={updating === appointment.id}
                    onEdit={(apt) => {
                      setEditingAppointment(apt);
                      setShowEditModal(true);
                    }}
                    onDelete={(aptId) => {
                      const apt = filteredAppointments.find(a => a.id === aptId);
                      setDeletingAppointment(apt);
                      setShowDeleteConfirm(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">New Appointment</h2>
              <button
                onClick={() => {
                  setShowNewAppointmentModal(false);
                  setNewAppointmentForm({
                    name: '',
                    phoneNumber: '',
                    doctorName: '',
                    appointmentType: '',
                    date: '',
                    time: '',
                    duration: '30',
                    mode: 'In-Person',
                    notes: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                    <input
                      type="text"
                      placeholder="Enter patient name"
                      value={newAppointmentForm.name}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={newAppointmentForm.phoneNumber}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
                    <select 
                      value={newAppointmentForm.doctorName}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, doctorName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select doctor</option>
                      <option value="Dr. Priya Singh">Dr. Priya Singh</option>
                      <option value="Dr. Amit Gupta">Dr. Amit Gupta</option>
                      <option value="Dr. Ravi Desai">Dr. Ravi Desai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type *</label>
                    <select 
                      value={newAppointmentForm.appointmentType}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, appointmentType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Check-up">Check-up</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={newAppointmentForm.date}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <input
                      type="time"
                      value={newAppointmentForm.time}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                    <select 
                      value={newAppointmentForm.duration}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode *</label>
                    <select 
                      value={newAppointmentForm.mode}
                      onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, mode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Add any additional notes..."
                    value={newAppointmentForm.notes}
                    onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewAppointmentModal(false);
                  setNewAppointmentForm({
                    name: '',
                    phoneNumber: '',
                    doctorName: '',
                    appointmentType: '',
                    date: '',
                    time: '',
                    duration: '30',
                    mode: 'In-Person',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validate required fields
                  if (!newAppointmentForm.name || !newAppointmentForm.doctorName || 
                      !newAppointmentForm.appointmentType || !newAppointmentForm.date || 
                      !newAppointmentForm.time) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                  }

                  // Call the create handler
                  await handleCreateAppointment({
                    name: newAppointmentForm.name,
                    doctorName: newAppointmentForm.doctorName,
                    appointmentType: newAppointmentForm.appointmentType,
                    date: newAppointmentForm.date,
                    time: newAppointmentForm.time,
                    duration: parseInt(newAppointmentForm.duration),
                    mode: newAppointmentForm.mode,
                    notes: newAppointmentForm.notes,
                    status: 'Scheduled'
                  });

                  // Reset form and close modal
                  setNewAppointmentForm({
                    name: '',
                    phoneNumber: '',
                    doctorName: '',
                    appointmentType: '',
                    date: '',
                    time: '',
                    duration: '30',
                    mode: 'In-Person',
                    notes: ''
                  });
                  setShowNewAppointmentModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Create Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Appointment</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAppointment(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleEditAppointment({
                name: formData.get('name'),
                doctorName: formData.get('doctorName'),
                date: formData.get('date'),
                time: formData.get('time'),
                duration: parseInt(formData.get('duration')),
                mode: formData.get('mode'),
                status: formData.get('status'),
                notes: formData.get('notes'),
              });
            }}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingAppointment.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
                    <select name="doctorName" required defaultValue={editingAppointment.doctorName} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Dr. Priya Singh">Dr. Priya Singh</option>
                      <option value="Dr. Amit Gupta">Dr. Amit Gupta</option>
                      <option value="Dr. Ravi Desai">Dr. Ravi Desai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select name="status" required defaultValue={editingAppointment.status} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={editingAppointment.date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <input
                      type="time"
                      name="time"
                      required
                      defaultValue={editingAppointment.time}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                    <select name="duration" required defaultValue={editingAppointment.duration} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode *</label>
                    <select name="mode" required defaultValue={editingAppointment.mode} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="In-Person">In-Person</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    defaultValue={editingAppointment.notes}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAppointment(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900">{deletingAppointment.name}</p>
                <p className="text-sm text-gray-600 mt-1">{deletingAppointment.doctorName}</p>
                <p className="text-sm text-gray-600">{deletingAppointment.date} at {deletingAppointment.time}</p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingAppointment(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAppointment}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className={`p-1 rounded hover:bg-opacity-20 ${
                notification.type === 'success' ? 'hover:bg-green-600' : 'hover:bg-red-600'
              }`}
            >
              <svg className={`w-4 h-4 ${
                notification.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
