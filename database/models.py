from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Compound(Base):
    __tablename__ = 'compounds'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    common_names = Column(JSON)  # List of alternative names
    category = Column(String(100), nullable=False, index=True)  # supplement, sarm, peptide, nootropic
    cas_number = Column(String(50), unique=True)
    molecular_formula = Column(String(255))
    legal_status = Column(String(100))
    safety_rating = Column(String(10))  # A, B, C, D
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    studies = relationship("Study", back_populates="compound")
    summaries = relationship("CompoundSummary", back_populates="compound")
    dosage_info = relationship("DosageInfo", back_populates="compound")

class Study(Base):
    __tablename__ = 'studies'
    
    id = Column(Integer, primary_key=True)
    compound_id = Column(Integer, ForeignKey('compounds.id'), nullable=False)
    pmid = Column(String(20), unique=True, index=True)
    doi = Column(String(255), unique=True)
    title = Column(Text, nullable=False)
    abstract = Column(Text)
    authors = Column(JSON)  # List of author names
    journal = Column(String(255))
    publication_year = Column(Integer, index=True)
    study_type = Column(String(100))  # RCT, meta-analysis, cohort, etc.
    sample_size = Column(Integer)
    population = Column(String(255))  # healthy adults, elderly, etc.
    evidence_level = Column(String(10))  # A, B, C, D based on study quality
    full_text_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    compound = relationship("Compound", back_populates="studies")
    claims = relationship("Claim", back_populates="study")

class Claim(Base):
    __tablename__ = 'claims'
    
    id = Column(Integer, primary_key=True)
    compound_id = Column(Integer, ForeignKey('compounds.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    claim_text = Column(Text, nullable=False)
    outcome_measure = Column(String(255))
    effect_direction = Column(String(20))  # positive, negative, neutral
    effect_size = Column(Float)
    confidence_interval = Column(String(50))
    p_value = Column(Float)
    evidence_strength = Column(String(10))  # A, B, C, D
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    study = relationship("Study", back_populates="claims")

class CompoundSummary(Base):
    __tablename__ = 'compound_summaries'
    
    id = Column(Integer, primary_key=True)
    compound_id = Column(Integer, ForeignKey('compounds.id'), nullable=False)
    overview = Column(Text)
    mechanism_of_action = Column(Text)
    benefits = Column(JSON)  # Structured list of benefits with evidence levels
    side_effects = Column(JSON)  # List of potential side effects
    interactions = Column(JSON)  # Drug/supplement interactions
    contraindications = Column(JSON)  # List of contraindications
    references = Column(JSON)  # List of PMIDs supporting the summary
    ai_generated = Column(Boolean, default=True)
    reviewed_by_expert = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    compound = relationship("Compound", back_populates="summaries")

class DosageInfo(Base):
    __tablename__ = 'dosage_info'
    
    id = Column(Integer, primary_key=True)
    compound_id = Column(Integer, ForeignKey('compounds.id'), nullable=False)
    form = Column(String(100))  # capsule, powder, liquid, etc.
    route = Column(String(50))   # oral, topical, injection
    min_dose = Column(Float)
    max_dose = Column(Float)
    unit = Column(String(20))    # mg, g, IU, etc.
    frequency = Column(String(100))  # daily, twice daily, etc.
    context = Column(String(255))    # with food, empty stomach, etc.
    population = Column(String(255)) # adults, elderly, athletes, etc.
    evidence_level = Column(String(10))
    
    # Relationships
    compound = relationship("Compound", back_populates="dosage_info")
