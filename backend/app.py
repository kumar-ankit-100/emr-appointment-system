"""
Healthcare EMR Appointment Management System - Backend
Flask API Server with Neon PostgreSQL
Simulates AWS Lambda + AppSync GraphQL resolvers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
from db import init_db, close_db, get_db
from appointment_service import AppointmentService, handle_appointment_request
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# CORS configuration - add your frontend URL after deployment
CORS(app)

# Initialize database on startup (Flask 3.0+ compatible)
def startup():
    """Initialize database connection"""
    try:
        init_db()
        logger.info("Application started, database connected")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

# Call startup before first request using new method
with app.app_context():
    startup()

# Database connection is persistent across requests and will be closed on process termination
# No need to close after each request context


# ============================================================================
# ROOT & HEALTH ENDPOINTS
# ============================================================================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'SwasthiQ EMR Appointment API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'appointments': '/api/appointments'
        }
    })


# ============================================================================
# GRAPHQL-STYLE QUERY ENDPOINTS (simulating AppSync resolvers)
# ============================================================================

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    """
    GraphQL Query Resolver: getAppointments
    
    Query Parameters:
    - date: Filter by specific date (YYYY-MM-DD)
    - status: Filter by status (Confirmed|Scheduled|Upcoming|Cancelled)
    
    Example requests:
    GET /api/appointments
    GET /api/appointments?date=2025-12-15
    GET /api/appointments?status=Confirmed
    GET /api/appointments?date=2025-12-15&status=Confirmed
    
    Response:
    {
        "data": [
            {
                "id": "uuid",
                "patientName": "Name",
                "doctorName": "Dr. Name",
                "date": "2025-12-15",
                "time": "09:00",
                "duration": 30,
                "status": "Confirmed",
                "mode": "In-Person",
                "notes": "...",
                "createdAt": "2025-12-15T09:00:00"
            }
        ],
        "success": true,
        "message": "Appointments retrieved successfully"
    }
    """
    try:
        # Build filters from query parameters
        filters = {}
        
        if 'date' in request.args:
            filters['date'] = request.args.get('date')
        
        if 'status' in request.args:
            filters['status'] = request.args.get('status')
        
        # Call GraphQL resolver
        appointments = AppointmentService.get_appointments(filters)
        
        return jsonify({
            'data': appointments,
            'success': True,
            'message': 'Appointments retrieved successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching appointments: {e}")
        return jsonify({
            'data': None,
            'success': False,
            'message': f'Error fetching appointments: {str(e)}'
        }), 500


@app.route('/api/appointments/date-range', methods=['GET'])
def get_appointments_by_date_range():
    """
    GraphQL Query Resolver: getAppointmentsByDateRange
    
    Query Parameters:
    - startDate: Start date (YYYY-MM-DD)
    - endDate: End date (YYYY-MM-DD)
    
    Example:
    GET /api/appointments/date-range?startDate=2025-12-15&endDate=2025-12-20
    """
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        if not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'startDate and endDate parameters required'
            }), 400
        
        appointments = AppointmentService.get_appointments_by_date_range(start_date, end_date)
        
        return jsonify({
            'data': appointments,
            'success': True,
            'message': 'Appointments retrieved successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching appointments by date range: {e}")
        return jsonify({
            'success': False,
            'message': f'Error fetching appointments: {str(e)}'
        }), 500


@app.route('/api/appointments/status/<status>', methods=['GET'])
def get_appointments_by_status(status):
    """
    GraphQL Query Resolver: getAppointmentsByStatus
    
    Path Parameters:
    - status: Status filter (Confirmed|Scheduled|Upcoming|Cancelled)
    
    Example:
    GET /api/appointments/status/Confirmed
    """
    try:
        valid_statuses = ['Confirmed', 'Scheduled', 'Upcoming', 'Cancelled']
        
        if status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        appointments = AppointmentService.get_appointments_by_status(status)
        
        return jsonify({
            'data': appointments,
            'success': True,
            'message': 'Appointments retrieved successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching appointments by status: {e}")
        return jsonify({
            'success': False,
            'message': f'Error fetching appointments: {str(e)}'
        }), 500


# ============================================================================
# GRAPHQL-STYLE MUTATION ENDPOINTS (simulating AppSync resolvers)
# ============================================================================

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    """Create new appointment with validation"""
    try:
        data = request.get_json()
        logger.info(f"Received create appointment request with data: {data}")
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required'
            }), 400
        
        # Validate required fields (appointmentType is optional, not stored in DB)
        required_fields = ['name', 'doctorName', 'date', 'time', 'duration']
        missing_fields = [field for field in required_fields if field not in data or not str(data[field]).strip()]
        
        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}. Received data: {data}")
            return jsonify({
                'success': False,
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        result = AppointmentService.create_appointment(data)
        logger.info(f"Create appointment result: {result}")
        status_code = 201 if result['success'] else 400
        return jsonify(result), status_code
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        return jsonify({
            'success': False,
            'message': f'Error creating appointment: {str(e)}'
        }), 500


@app.route('/api/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Delete appointment"""
    try:
        result = AppointmentService.delete_appointment(appointment_id)
        status_code = 200 if result['success'] else 404
        return jsonify(result), status_code
    except Exception as e:
        logger.error(f"Error deleting appointment: {e}")
        return jsonify({
            'success': False,
            'message': f'Error deleting appointment: {str(e)}'
        }), 500


@app.route('/api/appointments/<appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Update appointment"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required'
            }), 400
        
        result = AppointmentService.update_appointment(appointment_id, data)
        status_code = 200 if result['success'] else 404
        return jsonify(result), status_code
    except Exception as e:
        logger.error(f"Error updating appointment: {e}")
        return jsonify({
            'success': False,
            'message': f'Error updating appointment: {str(e)}'
        }), 500


@app.route('/api/appointments/<appointment_id>/status', methods=['PUT', 'PATCH'])
def update_appointment_status(appointment_id):
    """
    GraphQL Mutation Resolver: updateAppointmentStatus
    
    Updates appointment status with full transactional support
    
    Request Body (JSON):
    {
        "status": "Confirmed"  // Must be: Confirmed|Scheduled|Upcoming|Cancelled
    }
    
    Response:
    {
        "success": true,
        "message": "Appointment status updated to Confirmed",
        "id": "uuid",
        "status": "Confirmed",
        "timestamp": "2025-12-15T09:00:00"
    }
    
    PRODUCTION FLOW (AWS Architecture):
    1. Lambda receives mutation from AppSync
    2. Opens transaction with Aurora PostgreSQL
    3. Updates record with ACID guarantees
    4. Publishes to SNS topic 'appointment-status-updated'
    5. EventBridge captures and routes event
    6. Lambda notifies all connected AppSync subscriptions
    7. WebSocket clients receive real-time update
    
    This implementation demonstrates:
    - Transaction safety (data consistency)
    - Error handling and rollback
    - Clear logging for audit trail
    - GraphQL-style resolver pattern
    """
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required field: status'
            }), 400
        
        new_status = data['status']
        
        # Call GraphQL mutation resolver
        result = AppointmentService.update_appointment_status(appointment_id, new_status)
        
        # Simulate AppSync subscription notification
        # In production, this would publish to SNS/EventBridge
        if result['success']:
            logger.info(f"Broadcasting update via AppSync subscription: onAppointmentStatusUpdated")
            logger.info(f"  Appointment ID: {appointment_id}")
            logger.info(f"  New Status: {new_status}")
            # Frontend WebSocket would receive this update in real-time
            # Payload would be: { appointmentId, status, timestamp }
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
    
    except Exception as e:
        logger.error(f"Error updating appointment status: {e}")
        return jsonify({
            'success': False,
            'message': f'Error updating appointment: {str(e)}'
        }), 500


# ============================================================================
# COMPATIBILITY ENDPOINT (REST bridge for testing)
# ============================================================================

@app.route('/api/graphql-bridge', methods=['POST'])
def graphql_bridge():
    """
    REST-to-GraphQL bridge for development/testing
    
    In production, requests would go directly to AppSync GraphQL endpoint
    
    Request format:
    {
        "action": "getAppointments" | "updateAppointmentStatus",
        "payload": { ... }
    }
    """
    try:
        data = request.get_json()
        action = data.get('action')
        payload = data.get('payload', {})
        
        result = handle_appointment_request(action, payload)
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error in GraphQL bridge: {e}")
        return jsonify({
            'success': False,
            'message': f'Error processing request: {str(e)}'
        }), 500


# ============================================================================
# HEALTH CHECK & DIAGNOSTICS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        db = get_db()
        # Test database connection
        results = db.execute_query("SELECT 1")
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500


@app.route('/api/schema', methods=['GET'])
def get_schema():
    """Return GraphQL-style schema documentation"""
    return jsonify({
        'queries': {
            'getAppointments': {
                'description': 'Fetch appointments with optional filters',
                'parameters': {
                    'date': 'Optional - Filter by date (YYYY-MM-DD)',
                    'status': 'Optional - Filter by status (Confirmed|Scheduled|Upcoming|Cancelled)'
                },
                'example': 'GET /api/appointments?date=2025-12-15&status=Confirmed'
            },
            'getAppointmentsByDateRange': {
                'description': 'Fetch appointments within date range',
                'parameters': {
                    'startDate': 'Start date (YYYY-MM-DD)',
                    'endDate': 'End date (YYYY-MM-DD)'
                },
                'example': 'GET /api/appointments/date-range?startDate=2025-12-15&endDate=2025-12-20'
            }
        },
        'mutations': {
            'updateAppointmentStatus': {
                'description': 'Update appointment status with transaction support',
                'parameters': {
                    'appointmentId': 'UUID of appointment',
                    'status': 'New status (Confirmed|Scheduled|Upcoming|Cancelled)'
                },
                'example': 'PUT /api/appointments/{id}/status with body {"status": "Confirmed"}'
            }
        }
    }), 200


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Development server
    # For production, use: gunicorn app:app
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
