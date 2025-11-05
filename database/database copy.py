from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for development (much simpler!)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///supplement_research.db')

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database tables"""
    from .models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def get_session():
    """Get a database session for scripts"""
    return SessionLocal()
