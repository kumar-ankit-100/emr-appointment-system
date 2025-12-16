"""
Database Module - Neon PostgreSQL Connection Handler
Simulates AWS RDS Aurora connection with transaction support
"""

import os
import psycopg2
from psycopg2 import Error, sql
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from contextlib import contextmanager
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """
    Manages connection to Neon PostgreSQL database
    Implements connection pooling and transaction management
    """
    
    def __init__(self):
        """Initialize database connection parameters"""
        self.db_url = os.getenv('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        self.connection = None
    
    def connect(self):
        """
        Establish connection to Neon PostgreSQL database
        In production, this would connect to AWS Aurora with similar syntax
        """
        try:
            self.connection = psycopg2.connect(self.db_url)
            logger.info("Successfully connected to Neon PostgreSQL database")
            return self.connection
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    @contextmanager
    def get_cursor(self, commit=False):
        """
        Context manager for database cursor
        Automatically handles commit/rollback
        
        In production with AWS AppSync + Lambda:
        - This would be wrapped by AppSync resolver
        - Real-time updates would trigger AppSync subscriptions
        - Transactions ensure data consistency across multiple Lambdas
        """
        cursor = None
        try:
            if not self.connection:
                self.connect()
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            yield cursor
            if commit:
                self.connection.commit()
                logger.debug("Transaction committed")
        except Error as e:
            if self.connection:
                self.connection.rollback()
                logger.error(f"Transaction rolled back due to error: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
    
    def ensure_connection(self):
        """Ensure database connection is alive, reconnect if needed"""
        try:
            if not self.connection or self.connection.closed:
                logger.info("Reconnecting to database...")
                self.connect()
        except Exception as e:
            logger.error(f"Error ensuring connection: {e}")
            self.connect()
    
    def execute_query(self, query, params=None):
        """
        Execute SELECT query and return results
        Maps to GraphQL query resolvers
        """
        try:
            self.ensure_connection()
            with self.get_cursor() as cursor:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                return cursor.fetchall()
        except Error as e:
            logger.error(f"Error executing query: {e}")
            # Try reconnecting once
            try:
                logger.info("Attempting to reconnect...")
                self.connect()
                with self.get_cursor() as cursor:
                    if params:
                        cursor.execute(query, params)
                    else:
                        cursor.execute(query)
                    return cursor.fetchall()
            except Exception as retry_error:
                logger.error(f"Retry failed: {retry_error}")
                raise
    
    def execute_mutation(self, query, params=None):
        """
        Execute INSERT/UPDATE/DELETE with transaction support
        Maps to GraphQL mutation resolvers
        
        In AWS Lambda with Aurora:
        - Transaction would be wrapped in Lambda execution context
        - AppSync subscription would be triggered after mutation
        - Database changes would propagate to all connected clients via WebSocket
        """
        try:
            self.ensure_connection()
            with self.get_cursor(commit=True) as cursor:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                self.connection.commit()
                logger.debug(f"Mutation executed: {query[:50]}...")
                # In real AppSync, this would trigger: 
                # onAppointmentStatusUpdated subscription
                return cursor.rowcount
        except Error as e:
            logger.error(f"Error executing mutation: {e}")
            # Try reconnecting once
            try:
                logger.info("Attempting to reconnect for mutation...")
                self.connect()
                with self.get_cursor(commit=True) as cursor:
                    if params:
                        cursor.execute(query, params)
                    else:
                        cursor.execute(query)
                    self.connection.commit()
                    return cursor.rowcount
            except Exception as retry_error:
                logger.error(f"Mutation retry failed: {retry_error}")
                raise


# Global database instance
db = None

def init_db():
    """Initialize database connection on application startup"""
    global db
    db = DatabaseConnection()
    db.connect()
    logger.info("Database initialized")

def get_db():
    """Get database instance"""
    global db
    if not db:
        init_db()
    return db

def close_db():
    """Close database connection on application shutdown"""
    global db
    if db:
        db.disconnect()
