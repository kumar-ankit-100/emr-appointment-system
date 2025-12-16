/**
 * SwasthiQ EMR - Glassmorphism Edition
 * Modern appointment management with stunning glassmorphism UI
 * Features: All/Upcoming/Today/Past tabs, Search, Statistics, Export, Quick Actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { CalendarAdvanced } from './CalendarAdvanced';
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
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(null);

  // Tab definitions - INCLUDING "ALL"
  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'upcoming', label: 'Upcoming', icon: '📅' },
    { id: 'today', label: 'Today', icon: '⭐' },
    { id: 'past', label: 'Past', icon: '🕐' },
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
    if (activeTab === 'all') {
      // Show all appointments - no filtering
      filtered = appointments;
    } else if (activeTab === 'today') {
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
        
        // Show success notification
        showNotification('✅ Status updated successfully!', 'success');
      } else {
        showNotification('❌ Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('❌ Error updating status', 'error');
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
    
    showNotification('📥 Appointments exported successfully!', 'success');
  };

  /**
   * Show notification toast
   */
  const showNotification = (message, type) => {
    // Simple notification - you can enhance this with a library like react-toastify
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl backdrop-blur-xl shadow-2xl border animate-slideIn ${
      type === 'success' 
        ? 'bg-green-500/90 border-green-300 text-white' 
        : 'bg-red-500/90 border-red-300 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s ease-out';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  };

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Main Container with Animated Background */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient"></div>
        
        {/* Floating Orbs for Glassmorphism Effect */}
        <div className="fixed top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-blob"></div>
        <div className="fixed top-0 right-0 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="fixed bottom-0 left-1/2 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header with Glassmorphism */}
          <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/30 border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      SwasthiQ EMR
                    </h1>
                    <p className="text-sm text-gray-600 font-medium">
                      Healthcare Appointment Management
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Database Status */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/40 border border-white/30 shadow-lg">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        dbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-sm font-semibold text-gray-700">
                      {dbConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExport}
                    disabled={filteredAppointments.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 backdrop-blur-md transform hover:scale-105"
                  >
                    <span>📥</span>
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner with Glassmorphism */}
          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <div className="backdrop-blur-xl bg-red-500/20 border-2 border-red-300/50 rounded-2xl p-4 flex items-center gap-3 animate-slideIn shadow-xl">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
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
                <CalendarAdvanced
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

                {/* Tabs with ALL option */}
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Appointment Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 backdrop-blur-xl bg-white/30 rounded-3xl border border-white/20 shadow-xl">
                    <div className="text-6xl mb-4 animate-bounce">📭</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No appointments found
                    </h3>
                    <p className="text-gray-600">
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
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg font-semibold"
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
        </div>

        {/* Quick Actions FAB */}
        <QuickActions
          onRefresh={fetchAppointments}
          onClearFilters={() => {
            setSearchQuery('');
            setSelectedDate(null);
            setActiveTab('all');
          }}
        />
      </div>

      {/* Additional Animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </>
  );
};
