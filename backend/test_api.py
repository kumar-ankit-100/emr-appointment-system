"""
Test Script - Verify Backend Functionality
Run this to test all API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_get_all_appointments():
    """Test getting all appointments"""
    print("Testing get all appointments...")
    response = requests.get(f"{BASE_URL}/api/appointments")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Total appointments: {len(data.get('data', []))}")
    if data.get('data'):
        print(f"First appointment: {json.dumps(data['data'][0], indent=2)}\n")

def test_get_appointments_by_status():
    """Test getting appointments by status"""
    print("Testing get appointments by status (Confirmed)...")
    response = requests.get(f"{BASE_URL}/api/appointments/status/Confirmed")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Confirmed appointments: {len(data.get('data', []))}\n")

def test_get_appointments_by_date():
    """Test getting appointments by date"""
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"Testing get appointments by date ({today})...")
    response = requests.get(f"{BASE_URL}/api/appointments?date={today}")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Today's appointments: {len(data.get('data', []))}\n")

def test_update_status():
    """Test updating appointment status"""
    print("Testing update appointment status...")
    # First get an appointment
    response = requests.get(f"{BASE_URL}/api/appointments")
    data = response.json()
    
    if data.get('data') and len(data['data']) > 0:
        appointment = data['data'][0]
        appointment_id = appointment['id']
        current_status = appointment['status']
        
        # Toggle status
        new_status = 'Confirmed' if current_status != 'Confirmed' else 'Scheduled'
        
        print(f"Updating appointment {appointment_id}")
        print(f"Current status: {current_status}")
        print(f"New status: {new_status}")
        
        response = requests.put(
            f"{BASE_URL}/api/appointments/{appointment_id}/status",
            json={'status': new_status}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    else:
        print("No appointments found to update\n")

def test_schema():
    """Test schema endpoint"""
    print("Testing schema endpoint...")
    response = requests.get(f"{BASE_URL}/api/schema")
    print(f"Status: {response.status_code}")
    print(f"Schema: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("EMR Appointment System - Backend API Tests")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_get_all_appointments()
        test_get_appointments_by_status()
        test_get_appointments_by_date()
        test_update_status()
        test_schema()
        
        print("=" * 60)
        print("All tests completed!")
        print("=" * 60)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend. Is it running on port 5000?")
    except Exception as e:
        print(f"Error running tests: {e}")
