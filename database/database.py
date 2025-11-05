from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Use your existing SQLite database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///supplement_research.db')

# Configure engine with optimizations
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,  # Recycle connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI dependency to get database session
def get_db():
    """Get database session for FastAPI dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Legacy function for your existing scripts
def get_session():
    """Get a database session for scripts (legacy compatibility)"""
    return SessionLocal()

def init_database():
    """Initialize database tables"""
    from .models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def test_connection():
    """Test database connection"""
    try:
        db = SessionLocal()
        # Try to execute a simple query
        db.execute("SELECT 1")
        db.close()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Database health check for monitoring
def get_db_stats():
    """Get database statistics for monitoring"""
    try:
        db = SessionLocal()
        from .models import Compound, Study, CompoundSummary
        
        stats = {
            "compounds_count": db.query(Compound).count(),
            "studies_count": db.query(Study).count(),
            "summaries_count": db.query(CompoundSummary).count(),
            "connection_status": "healthy"
        }
        db.close()
        return stats
    except Exception as e:
        return {
            "connection_status": "error",
            "error": str(e)
        }
