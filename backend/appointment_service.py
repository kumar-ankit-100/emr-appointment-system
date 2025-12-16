"""
Appointment Service - GraphQL-style API Layer
Simulates AWS Lambda resolver functions for appointment operations
Implements AppSync-style query and mutation handlers
"""

import json
from datetime import datetime, date, timedelta
from db import get_db
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class AppointmentService:
    """
    GraphQL Resolver-like service for appointment management
    Simulates AWS AppSync resolvers that Lambda would implement
    """
    
    @staticmethod
    def _format_appointment(row: Dict) -> Dict:
        """Helper to format database row to frontend-compatible format"""
        return {
            'id': str(row['id']),
            'name': row['patient_name'],
            'doctorName': row['doctor_name'],
            'date': row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
            'time': str(row['time'])[:5] if isinstance(row['time'], str) else row['time'].isoformat()[:5],
            'duration': row['duration'],
            'status': row['status'],
            'mode': row['mode'],
            'notes': row['notes'] or '',
            'createdAt': row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else str(row['created_at'])
        }
    
    # GraphQL QUERY RESOLVER
    @staticmethod
    def get_appointments(filters: Dict = None) -> List[Dict]:
        """
        Query resolver: Fetch appointments with optional filters
        
        Maps to GraphQL Query:
        query GetAppointments($dateFilter: String, $statusFilter: String) {
            getAppointments(date: $dateFilter, status: $statusFilter) {
                id
                patientName
                doctorName
                date
                time
                duration
                status
                mode
                createdAt
            }
        }
        
        In production AWS architecture:
        - This would be an AWS Lambda function
        - AppSync would route the GraphQL query to this resolver
        - Results would be cached in ElastiCache for performance
        - This same logic would run across multiple Lambda instances
        
        Args:
            filters: Optional dict with 'date' and/or 'status' keys
            
        Returns:
            List of appointment dictionaries
        """
        if filters is None:
            filters = {}
        
        try:
            db_conn = get_db()
            
            # Build dynamic SQL query based on filters
            query = "SELECT * FROM appointments WHERE 1=1"
            params = []
            
            # Filter by date if provided
            if 'date' in filters and filters['date']:
                query += " AND date = %s"
                params.append(filters['date'])
            
            # Filter by status if provided
            if 'status' in filters and filters['status']:
                query += " AND status = %s"
                params.append(filters['status'])
            
            # Order by date and time for consistent results
            query += " ORDER BY date ASC, time ASC"
            
            logger.debug(f"Executing GraphQL Query: {query} with params: {params}")
            
            # Execute query - maps to database read operation
            results = db_conn.execute_query(query, params)
            
            # Transform results for GraphQL response (camelCase)
            appointments = [AppointmentService._format_appointment(row) for row in results]
            
            logger.info(f"Retrieved {len(appointments)} appointments with filters: {filters}")
            return appointments
            
        except Exception as e:
            logger.error(f"Error fetching appointments: {e}")
            raise
    
    # GraphQL MUTATION RESOLVER
    @staticmethod
    def update_appointment_status(appointment_id: str, new_status: str) -> Dict:
        """
        Mutation resolver: Update appointment status with transaction
        
        Maps to GraphQL Mutation:
        mutation UpdateAppointmentStatus($appointmentId: ID!, $newStatus: String!) {
            updateAppointmentStatus(id: $appointmentId, status: $newStatus) {
                id
                status
                updatedAt
                success
                message
            }
        }
        
        TRANSACTION FLOW (Production AWS Architecture):
        1. Lambda receives mutation request from AppSync
        2. Opens database transaction with Aurora
        3. Validates new status value
        4. Updates appointment record with ACID guarantees
        5. Commits transaction (Aurora ensures durability)
        6. AppSync subscription triggers (via SNS/EventBridge)
        7. All connected WebSocket clients receive real-time update
        
        REAL-TIME UPDATE MECHANISM (AWS AppSync):
        - After mutation completes, SNS publishes to EventBridge
        - EventBridge triggers Lambda that publishes to AppSync subscriptions
        - Subscription: onAppointmentStatusUpdated
        - WebSocket connections receive update in real-time
        - Frontend receives optimistic update confirmation
        
        Args:
            appointment_id: UUID of appointment to update
            new_status: New status value (Confirmed|Scheduled|Upcoming|Cancelled)
            
        Returns:
            Dict with update result and metadata
        """
        valid_statuses = ['Confirmed', 'Scheduled', 'Upcoming', 'Cancelled']
        
        try:
            # Input validation
            if new_status not in valid_statuses:
                return {
                    'success': False,
                    'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}',
                    'id': appointment_id,
                    'status': None
                }
            
            db_conn = get_db()
            
            # TRANSACTION BEGINS HERE
            # In Aurora, this would use: BEGIN TRANSACTION; ... COMMIT;
            # Ensures data consistency across multiple concurrent updates
            
            update_query = """
                UPDATE appointments 
                SET status = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
                RETURNING id, status, updated_at
            """
            
            logger.debug(f"Starting transaction: Update appointment {appointment_id} to status {new_status}")
            
            # Execute update with transaction support
            result = db_conn.execute_mutation(update_query, (new_status, appointment_id))
            
            # TRANSACTION ENDS HERE (auto-commit in execute_mutation)
            # In production, post-transaction hooks would:
            # 1. Publish to SNS topic: 'appointment-status-updated'
            # 2. EventBridge Rule: appointment-mutations-rule
            # 3. Lambda: notify-subscribers
            # 4. AppSync Subscription: onAppointmentStatusUpdated
            # 5. WebSocket broadcast to all connected clients
            
            if result > 0:
                logger.info(f"Successfully updated appointment {appointment_id} to {new_status}")
                return {
                    'success': True,
                    'message': f'Appointment status updated to {new_status}',
                    'id': appointment_id,
                    'status': new_status,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'message': f'Appointment not found: {appointment_id}',
                    'id': appointment_id,
                    'status': None
                }
                
        except Exception as e:
            logger.error(f"Error updating appointment status: {e}")
            # In production, Aurora would rollback the transaction here
            return {
                'success': False,
                'message': f'Error updating appointment: {str(e)}',
                'id': appointment_id,
                'status': None
            }
    
    @staticmethod
    def get_appointments_by_date_range(start_date: date, end_date: date) -> List[Dict]:
        """
        Helper resolver: Get appointments within date range
        Useful for calendar views
        """
        try:
            db_conn = get_db()
            query = """
                SELECT * FROM appointments 
                WHERE date BETWEEN %s AND %s
                ORDER BY date ASC, time ASC
            """
            results = db_conn.execute_query(query, (start_date, end_date))
            
            appointments = []
            for row in results:
                appointments.append({
                    'id': str(row['id']),
                    'patientName': row['patient_name'],
                    'doctorName': row['doctor_name'],
                    'date': row['date'].isoformat(),
                    'time': row['time'].isoformat(),
                    'duration': row['duration'],
                    'status': row['status'],
                    'mode': row['mode'],
                    'notes': row['notes'],
                    'createdAt': row['created_at'].isoformat()
                })
            
            return appointments
        except Exception as e:
            logger.error(f"Error fetching appointments by date range: {e}")
            raise
    
    @staticmethod
    def get_appointments_by_status(status: str) -> List[Dict]:
        """Helper resolver: Get appointments by status"""
        try:
            return AppointmentService.get_appointments({'status': status})
        except Exception as e:
            logger.error(f"Error fetching appointments by status: {e}")
            raise
    
    @staticmethod
    def validate_appointment_time(time_str: str) -> Dict:
        """Validate appointment time is within business hours (8 AM - 9 PM)"""
        try:
            hour = int(time_str.split(':')[0])
            if hour < 8 or hour >= 21:
                return {
                    'valid': False,
                    'message': 'Appointments are only available between 8:00 AM and 9:00 PM'
                }
            return {'valid': True}
        except Exception as e:
            return {
                'valid': False,
                'message': f'Invalid time format: {str(e)}'
            }
    
    @staticmethod
    def check_time_slot_conflict(doctor_name: str, date: str, time: str, duration: int, exclude_id: str = None) -> Dict:
        """Check if time slot conflicts with existing appointments"""
        try:
            db = get_db()
            
            # Parse time and calculate end time
            time_parts = time.split(':')
            start_hour = int(time_parts[0])
            start_min = int(time_parts[1])
            start_minutes = start_hour * 60 + start_min
            end_minutes = start_minutes + duration
            
            # Query for conflicting appointments
            query = """
                SELECT id, patient_name, time, duration 
                FROM appointments 
                WHERE doctor_name = %s 
                AND date = %s 
                AND status != 'Cancelled'
            """
            params = [doctor_name, date]
            
            if exclude_id:
                query += " AND id != %s"
                params.append(exclude_id)
            
            existing = db.execute_query(query, params)
            
            for apt in existing:
                # Calculate existing appointment time range
                apt_time = str(apt['time'])[:5]
                apt_parts = apt_time.split(':')
                apt_start_hour = int(apt_parts[0])
                apt_start_min = int(apt_parts[1])
                apt_start_minutes = apt_start_hour * 60 + apt_start_min
                apt_end_minutes = apt_start_minutes + apt['duration']
                
                # Check for overlap
                if (start_minutes < apt_end_minutes and end_minutes > apt_start_minutes):
                    # Calculate end time for better message
                    apt_end_hour = apt_end_minutes // 60
                    apt_end_min = apt_end_minutes % 60
                    apt_end_time = f"{apt_end_hour:02d}:{apt_end_min:02d}"
                    return {
                        'available': False,
                        'message': f'This time slot is already booked! {apt["patient_name"]} has an appointment from {apt_time} to {apt_end_time}. Please choose a different time.',
                        'conflicting_appointment': {
                            'patient': apt['patient_name'],
                            'time': apt_time,
                            'endTime': apt_end_time,
                            'duration': apt['duration']
                        }
                    }
            
            return {'available': True}
            
        except Exception as e:
            logger.error(f"Error checking time slot: {e}")
            return {
                'available': False,
                'message': f'Error checking availability: {str(e)}'
            }
    
    @staticmethod
    def create_appointment(data: Dict) -> Dict:
        """Create new appointment with validation"""
        try:
            # Validate time is within business hours
            time_validation = AppointmentService.validate_appointment_time(data['time'])
            if not time_validation['valid']:
                return {
                    'success': False,
                    'message': time_validation['message']
                }
            
            # Check for time slot conflicts
            conflict_check = AppointmentService.check_time_slot_conflict(
                data['doctorName'],
                data['date'],
                data['time'],
                data['duration']
            )
            
            if not conflict_check['available']:
                return {
                    'success': False,
                    'message': conflict_check['message'],
                    'conflict': conflict_check.get('conflicting_appointment')
                }
            
            db = get_db()
            
            # Insert appointment
            insert_query = """
                INSERT INTO appointments (patient_name, doctor_name, date, time, duration, status, mode, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            params = (
                data['name'],
                data['doctorName'],
                data['date'],
                data['time'],
                data['duration'],
                data.get('status', 'Scheduled'),
                data.get('mode', 'In-Person'),
                data.get('notes', '')
            )
            
            result = db.execute_mutation(insert_query, params)
            
            if result > 0:
                # Fetch the created appointment
                query = "SELECT * FROM appointments WHERE patient_name = %s AND date = %s AND time = %s ORDER BY created_at DESC LIMIT 1"
                created = db.execute_query(query, (data['name'], data['date'], data['time']))
                
                if created:
                    logger.info(f"Created appointment for {data['name']}")
                    return {
                        'success': True,
                        'message': 'Appointment created successfully',
                        'data': AppointmentService._format_appointment(created[0])
                    }
            
            return {
                'success': False,
                'message': 'Failed to create appointment'
            }
            
        except Exception as e:
            logger.error(f"Error creating appointment: {e}")
            return {
                'success': False,
                'message': f'Error creating appointment: {str(e)}'
            }
    
    @staticmethod
    def delete_appointment(appointment_id: str) -> Dict:
        """Delete appointment by ID"""
        try:
            db = get_db()
            
            # Check if appointment exists
            query = "SELECT * FROM appointments WHERE id = %s"
            result = db.execute_query(query, (appointment_id,))
            
            if not result:
                return {
                    'success': False,
                    'message': f'Appointment not found'
                }
            
            # Delete appointment using mutation
            delete_query = "DELETE FROM appointments WHERE id = %s"
            deleted_count = db.execute_mutation(delete_query, (appointment_id,))
            
            if deleted_count > 0:
                logger.info(f"Deleted appointment: {appointment_id}")
                return {
                    'success': True,
                    'message': 'Appointment deleted successfully',
                    'data': AppointmentService._format_appointment(result[0])
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to delete appointment'
                }
                
        except Exception as e:
            logger.error(f"Error deleting appointment: {e}")
            return {
                'success': False,
                'message': f'Error deleting appointment: {str(e)}'
            }
    
    @staticmethod
    def update_appointment(appointment_id: str, data: Dict) -> Dict:
        """Update appointment with new data and validation"""
        try:
            db = get_db()
            
            # Check if appointment exists
            query = "SELECT * FROM appointments WHERE id = %s"
            result = db.execute_query(query, (appointment_id,))
            
            if not result:
                return {
                    'success': False,
                    'message': f'Appointment not found'
                }
            
            existing = result[0]
            
            # Validate time if being updated
            if 'time' in data:
                time_validation = AppointmentService.validate_appointment_time(data['time'])
                if not time_validation['valid']:
                    return {
                        'success': False,
                        'message': time_validation['message']
                    }
            
            # Check for time slot conflicts if time/date/doctor/duration is being updated
            if any(key in data for key in ['time', 'date', 'doctorName', 'duration']):
                check_doctor = data.get('doctorName', existing['doctor_name'])
                check_date = data.get('date', existing['date'].isoformat() if hasattr(existing['date'], 'isoformat') else str(existing['date']))
                check_time = data.get('time', str(existing['time'])[:5])
                check_duration = data.get('duration', existing['duration'])
                
                conflict_check = AppointmentService.check_time_slot_conflict(
                    check_doctor,
                    check_date,
                    check_time,
                    check_duration,
                    exclude_id=appointment_id
                )
                
                if not conflict_check['available']:
                    return {
                        'success': False,
                        'message': conflict_check['message'],
                        'conflict': conflict_check.get('conflicting_appointment')
                    }
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            if 'name' in data:
                update_fields.append('patient_name = %s')
                values.append(data['name'])
            if 'doctorName' in data:
                update_fields.append('doctor_name = %s')
                values.append(data['doctorName'])
            if 'date' in data:
                update_fields.append('date = %s')
                values.append(data['date'])
            if 'time' in data:
                update_fields.append('time = %s')
                values.append(data['time'])
            if 'duration' in data:
                update_fields.append('duration = %s')
                values.append(data['duration'])
            if 'status' in data:
                update_fields.append('status = %s')
                values.append(data['status'])
            if 'mode' in data:
                update_fields.append('mode = %s')
                values.append(data['mode'])
            if 'notes' in data:
                update_fields.append('notes = %s')
                values.append(data['notes'])
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            values.append(appointment_id)
            
            update_query = f"UPDATE appointments SET {', '.join(update_fields)} WHERE id = %s"
            updated_count = db.execute_mutation(update_query, tuple(values))
            
            if updated_count > 0:
                # Fetch updated appointment
                updated = db.execute_query("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
                logger.info(f"Updated appointment: {appointment_id}")
                return {
                    'success': True,
                    'message': 'Appointment updated successfully',
                    'data': AppointmentService._format_appointment(updated[0])
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to update appointment'
                }
                
        except Exception as e:
            logger.error(f"Error updating appointment: {e}")
            return {
                'success': False,
                'message': f'Error updating appointment: {str(e)}'
            }


# REST API compatibility layer (for frontend communication)
def handle_appointment_request(action: str, payload: Dict) -> Dict:
    """
    Handle incoming REST requests
    Bridges REST frontend with GraphQL resolver pattern
    
    In production, this would be replaced by AppSync GraphQL endpoint
    but this shows how REST maps to GraphQL operations
    """
    try:
        if action == 'getAppointments':
            filters = payload.get('filters', {})
            appointments = AppointmentService.get_appointments(filters)
            return {
                'data': appointments,
                'success': True,
                'message': 'Appointments retrieved successfully'
            }
        
        elif action == 'updateAppointmentStatus':
            appointment_id = payload.get('appointmentId')
            new_status = payload.get('status')
            result = AppointmentService.update_appointment_status(appointment_id, new_status)
            return result
        
        elif action == 'getAppointmentsByDateRange':
            start_date = payload.get('startDate')
            end_date = payload.get('endDate')
            appointments = AppointmentService.get_appointments_by_date_range(start_date, end_date)
            return {
                'data': appointments,
                'success': True,
                'message': 'Appointments retrieved successfully'
            }
        
        else:
            return {
                'success': False,
                'message': f'Unknown action: {action}'
            }
    
    except Exception as e:
        logger.error(f"Error handling appointment request: {e}")
        return {
            'success': False,
            'message': f'Error processing request: {str(e)}'
        }
