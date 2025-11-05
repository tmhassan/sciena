from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class EnhancedCompoundSummary(Base):
    __tablename__ = 'enhanced_compound_summaries'
    
    id = Column(Integer, primary_key=True)
    compound_id = Column(Integer, ForeignKey('compounds.id'), nullable=False)
    
    # Core content
    overview = Column(Text)
    mechanism_of_action = Column(Text)
    
    # Evidence assessment
    evidence_grade = Column(String(1))  # A, B, C, D
    evidence_confidence = Column(Float)
    total_studies = Column(Integer)
    rct_count = Column(Integer)
    meta_analysis_count = Column(Integer)
    
    # Structured data
    therapeutic_applications = Column(JSON)
    dosage_protocols = Column(JSON)
    safety_profile = Column(JSON)
    research_timeline = Column(JSON)
    key_takeaways = Column(JSON)
    
    # Metadata
    regulatory_status = Column(String(255))
    cost_effectiveness = Column(Text)
    references = Column(JSON)
    
    # Versioning and review
    version = Column(Integer, default=1)
    ai_generated = Column(Boolean, default=True)
    expert_reviewed = Column(Boolean, default=False)
    expert_reviewer_id = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    compound = relationship("Compound", back_populates="enhanced_summaries")

# Add to existing Compound model
Compound.enhanced_summaries = relationship("EnhancedCompoundSummary", back_populates="compound")
