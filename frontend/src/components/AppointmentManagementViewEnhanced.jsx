/**
 * Enhanced Appointment Management View - Main Component
 * Healthcare EMR dashboard with advanced features:
 * - Real-time search
 * - Animated statistics
 * - Heat map calendar showing appointment density
 * - Smooth animations and transitions
 * - Export functionality
 * - Advanced filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { CalendarWidget } from './CalendarWidgetEnhanced';
import { Tabs } from './Tabs';
import { StatisticsCard } from './StatisticsCard';
import { SearchBar } from './SearchBar';
import { QuickActions } from './QuickActions';
import { WelcomeModal } from './WelcomeModal';
import {
  getAppointments,
  updateAppointmentStatus,
  healthCheck,
} from '../services/appointmentApi';

export const AppointmentManagementView = () => {
  // State management
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  // Filter states
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(null);

  // Tab definitions
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: '📅' },
    { id: 'today', label: 'Today', icon: '⭐' },
    { id: 'past', label: 'Past', icon: '📋' },
  ];

  /**
   * Initialize application
   */
  const initialize = async () => {
    try {
      await healthCheck();
      setDbConnected(true);
      await fetchAppointments();
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to connect to server. Please ensure backend is running.');
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  /**
   * Fetch appointments with optional filters
   */
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};

      // Format date as YYYY-MM-DD
      if (selectedDate) {
        const dateObj = new Date(selectedDate + 'T00:00');
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        filters.date = `${year}-${month}-${day}`;
      }

      const response = await getAppointments(filters);

      if (response.success && Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        setError('Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Error fetching appointments. Check console for details.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Refetch when date filter changes
  useEffect(() => {
    if (dbConnected) {
      fetchAppointments();
    }
  }, [fetchAppointments, dbConnected]);

  /**
   * Apply tab-based filtering
   */
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = appointments;

    // Apply tab filter
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(query) ||
          apt.doctorName.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, activeTab, searchQuery]);

  /**
   * Handle status update
   */
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId);
      const response = await updateAppointmentStatus(appointmentId, newStatus);

      if (response.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        );
      } else {
        alert('Failed to update appointment status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * Export appointments to CSV
   */
  const handleExport = () => {
    const csv = [
      ['Patient Name', 'Doctor Name', 'Date', 'Time', 'Status', 'Mode', 'Duration', 'Notes'],
      ...filteredAppointments.map(apt => [
        apt.patientName,
        apt.doctorName,
        apt.date,
        apt.time,
        apt.status,
        apt.mode,
        apt.duration,
        apt.notes || '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Welcome Modal */}
      <WelcomeModal />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🏥 SwasthiQ EMR
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Appointment Management System
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Database Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    dbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  {dbConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={filteredAppointments.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>📥</span>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 animate-slideIn">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        <StatisticsCard appointments={appointments} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-1">
            <CalendarWidget
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
              appointments={appointments}
            />
          </div>

          {/* Right Column - Appointments */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by patient or doctor name..."
            />

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Appointment Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-r-cyan-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No appointments found
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : selectedDate
                    ? 'No appointments on this date'
                    : 'No appointments in this time period'}
                </p>
                {(searchQuery || selectedDate) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDate(null);
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <AppointmentCard
                      appointment={appointment}
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updating === appointment.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions FAB */}
      <QuickActions
        onRefresh={fetchAppointments}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedDate(null);
          setActiveTab('upcoming');
        }}
      />
    </div>
  );
};
