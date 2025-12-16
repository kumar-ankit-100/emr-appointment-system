/**
 * Appointment Management View - Main Component
 * Healthcare EMR dashboard with calendar, tabs, and appointment cards
 * Production-grade UI with real database integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { CalendarWidget } from './CalendarWidget';
import { Tabs } from './Tabs';
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
  const [updating, setUpdating] = useState(null); // Track which appointment is updating

  // Tab definitions for filtering by time period
  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'today', label: 'Today' },
    { id: 'past', label: 'Past' },
  ];

  // Initialize component - check database and fetch appointments
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check backend health
        const health = await healthCheck();
        setDbConnected(health.database === 'connected');

        // Fetch initial appointments
        await fetchAppointments();
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to connect to backend. Is the server running?');
        setDbConnected(false);
      }
    };

    initialize();
  }, []);

  /**
   * Fetch appointments from backend
   * Applies active filters: date and tab (time period)
   */
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter object for GraphQL query
      const filters = {};

      // Add date filter if selected - format as YYYY-MM-DD
      if (selectedDate) {
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        filters.date = `${year}-${month}-${day}`;
      }

      // Fetch from backend
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

  // Refetch when filters change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, selectedDate]);

  /**
   * Apply time-based filtering based on active tab
   * Compares appointment date with today
   */
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = appointments;

    if (activeTab === 'today') {
      filtered = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
    } else if (activeTab === 'upcoming') {
      filtered = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() > today.getTime();
      });
    } else if (activeTab === 'past') {
      filtered = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() < today.getTime();
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, activeTab]);

  /**
   * Handle appointment status update mutation
   * Updates database and refreshes UI
   * Simulates optimistic UI update with real backend confirmation
   */
  const handleStatusUpdate = useCallback(async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId);

      // Optimistic UI update
      setAppointments((prevAppointments) =>
        prevAppointments.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      // Call backend mutation
      const response = await updateAppointmentStatus(appointmentId, newStatus);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update appointment');
      }

      // In production with AWS AppSync:
      // - This mutation would trigger a subscription
      // - onAppointmentStatusUpdated subscription
      // - All connected clients would receive real-time update
      // - Database consistency guaranteed by Aurora transaction
      console.log('Appointment status updated successfully');
      console.log(
        'In production, AppSync would broadcast this to all connected clients:'
      );
      console.log({
        appointmentId,
        newStatus,
        timestamp: response.timestamp,
      });
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(`Failed to update appointment: ${err.message}`);

      // Revert optimistic update on error
      await fetchAppointments();
    } finally {
      setUpdating(null);
    }
  }, [fetchAppointments]);

  /**
   * Handle date selection from calendar
   * Triggers appointment refetch with date filter
   */
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Appointment Management
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                EMR System - Schedule & Queue Management
              </p>
            </div>

            {/* Database Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
              <div
                className={`w-3 h-3 rounded-full ${
                  dbConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {dbConnected ? 'Database Connected' : 'Database Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Calendar Widget */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <CalendarWidget selectedDate={selectedDate} onDateSelect={handleDateSelect} />
            </div>
          </aside>

          {/* Main Content - Appointments List */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter((a) => a.status === 'Confirmed').length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-100">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {appointments.filter((a) => a.status === 'Scheduled').length}
                </p>
              </div>
            </div>

            {/* Appointments Grid */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-white rounded-lg border border-blue-100 animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={updating === appointment.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-blue-200">
                <div className="text-6xl text-blue-400 mb-3">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No Appointments
                </h3>
                <p className="text-gray-600">
                  {selectedDate
                    ? 'No appointments scheduled for this date'
                    : 'No appointments in this category'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <p>
            Healthcare EMR System • Real-time appointment management with Neon PostgreSQL •
            Simulates AWS AppSync + Lambda
          </p>
        </div>
      </footer>
    </div>
  );
};
