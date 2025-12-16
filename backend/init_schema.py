#!/usr/bin/env python3
"""
Initialize database schema in Neon PostgreSQL
Runs schema.sql to create tables and seed data
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_schema():
    """Execute schema.sql to initialize database"""
    connection_string = os.getenv('DATABASE_URL')
    
    print("Connecting to Neon PostgreSQL...")
    conn = psycopg2.connect(connection_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Reading schema.sql...")
    with open('schema.sql', 'r') as f:
        schema_sql = f.read()
    
    print("Executing schema...")
    cursor.execute(schema_sql)
    
    print("✓ Schema initialized successfully!")
    print("Verifying table creation...")
    
    cursor.execute("SELECT COUNT(*) FROM appointments")
    count = cursor.fetchone()[0]
    print(f"✓ Found {count} appointments in database")
    
    cursor.close()
    conn.close()
    print("✓ Database initialization complete!")

if __name__ == '__main__':
    init_schema()
