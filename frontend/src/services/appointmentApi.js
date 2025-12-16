/**
 * Appointment API Service
 * Handles all communication with backend GraphQL-style API
 * Simulates AppSync GraphQL client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * GraphQL Query: getAppointments
 * Fetches appointments with optional filters
 */
export const getAppointments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.date) {
      queryParams.append('date', filters.date);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    const url = `${API_BASE_URL}/appointments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log('Fetching appointments:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

/**
 * GraphQL Query: getAppointmentsByDateRange
 * Fetches appointments within a date range
 */
export const getAppointmentsByDateRange = async (startDate, endDate) => {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    });
    
    const url = `${API_BASE_URL}/appointments/date-range?${queryParams}`;
    
    console.log('Fetching appointments by date range:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching appointments by date range:', error);
    throw error;
  }
};

/**
 * GraphQL Query: getAppointmentsByStatus
 * Fetches appointments filtered by status
 */
export const getAppointmentsByStatus = async (status) => {
  try {
    const url = `${API_BASE_URL}/appointments/status/${status}`;
    
    console.log('Fetching appointments by status:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching appointments by status:', error);
    throw error;
  }
};

/**
 * GraphQL Mutation: updateAppointmentStatus
 * Updates appointment status with transaction support
 * 
 * In production with AWS AppSync:
 * - This would establish WebSocket connection for real-time updates
 * - Subscription: onAppointmentStatusUpdated would trigger
 * - All connected clients receive update immediately
 */
export const updateAppointmentStatus = async (appointmentId, newStatus) => {
  try {
    const url = `${API_BASE_URL}/appointments/${appointmentId}/status`;
    
    console.log('Updating appointment status:', appointmentId, newStatus);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // In production AppSync, this would trigger:
    // subscription onAppointmentStatusUpdated {
    //   id
    //   status
    //   updatedAt
    // }
    // And all connected clients would receive this update
    
    return data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * GraphQL Mutation: deleteAppointment
 * Deletes an appointment
 */
export const deleteAppointment = async (appointmentId) => {
  try {
    const url = `${API_BASE_URL}/appointments/${appointmentId}`;
    
    console.log('Deleting appointment:', appointmentId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

/**
 * GraphQL Mutation: updateAppointment
 * Updates appointment details
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  try {
    const url = `${API_BASE_URL}/appointments/${appointmentId}`;
    
    console.log('Updating appointment:', appointmentId, appointmentData);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * GraphQL Mutation: createAppointment
 * Creates a new appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    const url = `${API_BASE_URL}/appointments`;
    
    console.log('Creating appointment:', appointmentData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Health check endpoint
 * Verifies backend and database connectivity
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Get API schema documentation
 */
export const getSchema = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
};
