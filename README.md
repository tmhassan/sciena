# 🔬 Sciena - AI-Powered Supplement Research Platform

A comprehensive evidence-based supplement research platform that automatically aggregates scientific literature from PubMed, analyzes thousands of studies using advanced AI, and generates detailed evidence-based summaries for supplements, nootropics, SARMs, and peptides. Sciena combines data acquisition, natural language processing, and structured knowledge extraction to provide clinically-relevant insights backed by peer-reviewed research.

## ✨ Key Features

### 📚 **Automated Literature Aggregation**
- **Multi-Database Integration**: PubMed, PubChem, FDA databases, and commercial supplement databases
- **Intelligent Compound Collection**: Scrapes iHerb, Vitacost, Bodybuilding.com, Labdoor for 10,000+ compounds
- **Research-Grade Compounds**: Comprehensive coverage of supplements, SARMs, peptides, and nootropics
- **Smart Categorization**: Automatic classification into supplements, SARMs, peptides, and nootropics

### 🤖 **AI-Powered Analysis**
- **GPT-4/GPT-3.5 Integration**: Advanced natural language understanding for study analysis
- **Evidence Grading System**: A/B/C/D grading based on study quality and design
- **Mechanism of Action Extraction**: Detailed pharmacological pathway analysis
- **Clinical Application Synthesis**: Therapeutic uses with evidence strength ratings

### 📊 **Comprehensive Profiles**
- **Evidence-Based Summaries**: Meta-analysis of all available research
- **Dosage Protocols**: Therapeutic ranges, loading protocols, timing recommendations
- **Safety Profiles**: Adverse events, contraindications, drug interactions
- **Clinical Evidence**: RCT counts, meta-analyses, systematic reviews
- **Quality Metrics**: Study type distribution, confidence intervals, p-values

### 🏗️ **Production-Ready Architecture**
- **FastAPI Backend**: High-performance async Python API
- **SQLite Database**: Efficient structured data storage
- **React Frontend**: Modern TypeScript-based UI (in development)
- **RESTful API**: Comprehensive endpoints for all data access
- **Automated Pipeline**: End-to-end processing from collection to summaries

## 🏗️ Architecture

```
sciena/
├── main.py                                # FastAPI application entry point
├── pipeline.py                            # Automated processing pipeline
│
├── data_acquisition/
│   ├── pubmed_client.py                   # PubMed API integration
│   └── multi_database_client.py           # Multi-source data fetching
│
├── database/
│   ├── models.py                          # SQLAlchemy ORM models
│   ├── database.py                        # Database connection management
│   └── supplement_research.db             # SQLite database
│
├── ai_processing/
│   ├── enhanced_summary_generator.py      # Advanced GPT-4 summaries
│   └── summary_generator.py               # Core AI generation logic
│
├── api/
│   └── routes/
│       ├── compounds.py                   # Compound CRUD endpoints
│       ├── studies.py                     # Study management endpoints
│       └── search.py                      # Advanced search endpoints
│
├── tasks/
│   ├── 01_build_master_list.py            # Compound collection
│   ├── 02_fetch_literature.py             # Study fetching
│   └── 03_generate_summaries.py           # AI summary generation
│
├── scripts/
│   ├── fetch_research.py                  # Manual research fetching
│   ├── generate_summaries.py              # Manual summary generation
│   └── setup_database.py                  # Database initialization
│
├── utils/
│   └── logger.py                          # Logging configuration
│
├── supplement-research-frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/                    # Reusable UI components
│   │   ├── pages/                         # Page components
│   │   └── services/                      # API integration
│   └── package.json
│
└── requirements.txt                       # Python dependencies
```

## 🚀 Getting Started

### Prerequisites

**Backend:**
- Python 3.8+
- pip
- OpenAI API key (for AI summary generation)

**Frontend (Optional):**
- Node.js 16+
- npm or yarn

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/z0d1a/sciena.git
cd sciena
```

#### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Configure Environment

Create a `.env` file in the project root:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# PubMed API (Optional - for increased rate limits)
PUBMED_EMAIL=your.email@example.com
PUBMED_TOOL=sciena_research_platform

# Database Configuration
DATABASE_URL=sqlite:///./supplement_research.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

#### 4. Initialize Database

```bash
python scripts/setup_database.py
```

#### 5. Run the Application

```bash
# Start FastAPI server
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive Docs**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

## 📖 Usage

### Automated Pipeline

The complete pipeline processes compounds from collection to AI summaries:

```bash
# Run complete pipeline
python pipeline.py
```

Pipeline stages:
1. **Build Master List** (`tasks/01_build_master_list.py`)
   - Scrapes supplement databases
   - Collects 10,000+ unique compounds
   - Categorizes by type
   
2. **Fetch Literature** (`tasks/02_fetch_literature.py`)
   - Searches PubMed for each compound
   - Fetches RCTs, meta-analyses, systematic reviews
   - Extracts study metadata
   
3. **Generate Summaries** (`tasks/03_generate_summaries.py`)
   - Analyzes studies with GPT-4
   - Generates comprehensive profiles
   - Calculates evidence grades

### Manual Operations

#### Collect Compounds
```bash
python tasks/01_build_master_list.py
```

Scrapes and aggregates from:
- iHerb (supplements)
- Vitacost (vitamins & minerals)
- Labdoor (ranked supplements)
- Bodybuilding.com (sports nutrition)
- PubChem (chemical compounds)
- Reddit (popular nootropics/SARMs/peptides)
- FDA (approved dietary supplements)

Output: `data/master_list.csv` with 10,000+ compounds

#### Fetch Research
```bash
python tasks/02_fetch_literature.py
```

For each compound:
- Searches PubMed with optimized queries
- Prioritizes high-quality studies (RCTs, meta-analyses)
- Extracts: PMID, DOI, title, abstract, authors, journal
- Stores in SQLite database

#### Generate AI Summaries
```bash
python tasks/03_generate_summaries.py
```

AI generates structured profiles with:
- Executive summary
- Mechanism of action
- Clinical evidence grades
- Therapeutic applications
- Dosage protocols
- Safety profiles
- Drug interactions
- Quality metrics

### API Usage

#### Get Compound Information
```bash
curl http://localhost:8000/api/compounds/1
```

Response:
```json
{
  "id": 1,
  "name": "Creatine Monohydrate",
  "category": "supplement",
  "common_names": ["Creatine", "Cr"],
  "molecular_formula": "C4H9N3O2",
  "safety_rating": "A",
  "legal_status": "Generally Recognized as Safe (GRAS)"
}
```

#### Search Compounds
```bash
curl "http://localhost:8000/api/search?q=creatine&category=supplement"
```

#### Get Studies for Compound
```bash
curl http://localhost:8000/api/studies?compound_id=1&limit=10
```

#### Get AI-Generated Summary
```bash
curl http://localhost:8000/api/compounds/1/summary
```

Returns comprehensive profile with:
- Evidence grades
- Mechanism of action
- Therapeutic applications
- Dosage recommendations
- Safety profile
- References (PMIDs)

## 🧪 Database Schema

### Core Tables

#### Compounds
```sql
CREATE TABLE compounds (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    common_names JSON,
    category VARCHAR(100) NOT NULL,  -- supplement, sarm, peptide, nootropic
    cas_number VARCHAR(50) UNIQUE,
    molecular_formula VARCHAR(255),
    legal_status VARCHAR(100),
    safety_rating VARCHAR(10),       -- A, B, C, D
    created_at DATETIME,
    updated_at DATETIME
);
```

#### Studies
```sql
CREATE TABLE studies (
    id INTEGER PRIMARY KEY,
    compound_id INTEGER FOREIGN KEY,
    pmid VARCHAR(20) UNIQUE,
    doi VARCHAR(255) UNIQUE,
    title TEXT NOT NULL,
    abstract TEXT,
    authors JSON,
    journal VARCHAR(255),
    publication_year INTEGER,
    study_type VARCHAR(100),         -- RCT, meta-analysis, cohort, etc.
    sample_size INTEGER,
    population VARCHAR(255),
    evidence_level VARCHAR(10),      -- A, B, C, D
    full_text_url VARCHAR(500),
    created_at DATETIME
);
```

#### Compound Summaries
```sql
CREATE TABLE compound_summaries (
    id INTEGER PRIMARY KEY,
    compound_id INTEGER FOREIGN KEY,
    overview TEXT,
    mechanism_of_action TEXT,
    benefits JSON,
    side_effects JSON,
    interactions JSON,
    contraindications JSON,
    references JSON,                 -- List of PMIDs
    ai_generated BOOLEAN,
    reviewed_by_expert BOOLEAN,
    version INTEGER,
    created_at DATETIME,
    updated_at DATETIME
);
```

#### Dosage Information
```sql
CREATE TABLE dosage_info (
    id INTEGER PRIMARY KEY,
    compound_id INTEGER FOREIGN KEY,
    form VARCHAR(100),               -- capsule, powder, liquid
    route VARCHAR(50),                -- oral, topical, injection
    min_dose FLOAT,
    max_dose FLOAT,
    unit VARCHAR(20),                 -- mg, g, IU
    frequency VARCHAR(100),           -- daily, twice daily
    context VARCHAR(255),             -- with food, empty stomach
    population VARCHAR(255),          -- adults, elderly, athletes
    evidence_level VARCHAR(10)
);
```

## 🧬 Evidence Grading System

### Study Quality Hierarchy

1. **Grade A (Highest Quality)**
   - Systematic reviews with meta-analysis
   - Multiple high-quality RCTs
   - Cochrane reviews
   - Large sample sizes (n > 500)

2. **Grade B (High Quality)**
   - Individual well-designed RCTs
   - Systematic reviews without meta-analysis
   - Prospective cohort studies
   - Moderate sample sizes (n > 100)

3. **Grade C (Moderate Quality)**
   - Retrospective cohort studies
   - Case-control studies
   - Cross-sectional studies
   - Small RCTs (n < 100)

4. **Grade D (Limited Quality)**
   - Animal studies
   - In vitro studies
   - Case reports
   - Expert opinion

### Evidence Calculation

```python
quality_score = (
    meta_analysis_count * 15 +
    systematic_review_count * 12 +
    rct_count * 10 +
    cohort_study_count * 7 +
    case_control_count * 5 +
    animal_study_count * 2 +
    in_vitro_count * 1
)

confidence = min(100, quality_score / total_studies * 100)
```

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern async web framework
- **SQLAlchemy**: ORM for database operations
- **OpenAI**: GPT-4/GPT-3.5 for AI summaries
- **Requests**: HTTP client for API calls
- **BeautifulSoup**: Web scraping
- **Pandas**: Data manipulation
- **Python-dotenv**: Environment management

### Data Sources
- **PubMed/NCBI**: Primary scientific literature
- **PubChem**: Chemical compound database
- **iHerb**: Commercial supplement database
- **Vitacost**: Vitamin/mineral database
- **Labdoor**: Independent supplement testing
- **FDA**: Dietary supplement database

### AI/NLP
- **OpenAI GPT-4**: Advanced summary generation
- **GPT-3.5 Turbo**: Cost-effective batch processing
- **JSON Schema Validation**: Structured output
- **Evidence Extraction**: NLP-based claim extraction

### Frontend (In Development)
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **React Router**: Navigation

## 📊 Example Output

### Sample Compound Profile: Creatine Monohydrate

```json
{
  "compound_name": "Creatine Monohydrate",
  "category": "supplement",
  "safety_rating": "A",
  
  "clinical_evidence": {
    "grade": "A",
    "confidence": 98.5,
    "study_count": 847,
    "rct_count": 312,
    "meta_analysis_count": 47,
    "systematic_review_count": 65
  },
  
  "therapeutic_applications": [
    {
      "indication": "Muscle Strength Enhancement",
      "evidence_strength": "A",
      "effect_size": "Large (d = 0.8-1.2)",
      "population": "Athletes and resistance training individuals",
      "dose_range": "3-5g daily",
      "supporting_studies": ["PMID:12945830", "PMID:17908288"],
      "p_value": 0.001,
      "clinical_significance": "Significant increases in 1RM strength"
    }
  ],
  
  "dosage_protocols": {
    "therapeutic_range": "3-5g per day",
    "loading_protocol": "20g/day for 5-7 days (optional)",
    "maintenance_dose": "3-5g daily",
    "timing_recommendations": "Post-workout preferred, with carbohydrates",
    "duration_recommendations": "Long-term use (months to years) is safe"
  },
  
  "safety_profile": {
    "overall_safety": "Excellent",
    "safety_grade": "A",
    "common_adverse_events": [
      {"event": "Water retention", "frequency": "Common", "severity": "Mild"}
    ],
    "contraindications": ["Kidney disease", "Dehydration"],
    "drug_interactions": [],
    "long_term_safety": "Extensive evidence supports long-term safety"
  },
  
  "mechanism_of_action": {
    "primary_pathways": [
      "Increases phosphocreatine stores in muscle",
      "Enhances ATP regeneration",
      "Improves high-intensity exercise capacity"
    ],
    "pharmacokinetics": {
      "absorption": "~100% bioavailability",
      "peak_plasma": "1-2 hours",
      "half_life": "~3 hours",
      "excretion": "Renal (creatinine)"
    }
  },
  
  "references": [
    "PMID:12945830", "PMID:17908288", "PMID:20091069"
  ]
}
```

## 🎯 Use Cases

1. **Clinical Decision Support**: Evidence-based supplement recommendations
2. **Research Synthesis**: Automated literature review and meta-analysis
3. **Consumer Education**: Accessible scientific information
4. **Healthcare Professional Tool**: Quick reference for supplement safety/efficacy
5. **Supplement Industry**: Quality control and formulation guidance
6. **Academic Research**: Database for population studies

## ⚠️ Disclaimer

### Medical Advice
- This platform provides **educational information only**
- Does NOT constitute medical advice
- Always consult healthcare providers before starting supplements
- Particularly important for pregnant/nursing women, children, those with medical conditions

### Research Limitations
- AI summaries are based on available literature at time of generation
- New research may change recommendations
- Individual responses to supplements vary
- Quality of source studies affects evidence grades

### Legal Status
- Legal status varies by country and jurisdiction
- Some compounds (SARMs, peptides) may be restricted
- Research chemicals are NOT approved for human consumption
- Verify local regulations before purchasing or using

## 🚀 Roadmap

### Phase 1: Core Platform ✅
- [x] Compound collection system
- [x] PubMed integration
- [x] AI summary generation
- [x] Database schema
- [x] RESTful API

### Phase 2: Enhanced Features (In Progress)
- [ ] React frontend development
- [ ] User authentication
- [ ] Saved searches and favorites
- [ ] Advanced filtering and sorting
- [ ] PDF report generation
- [ ] Email alerts for new research

### Phase 3: Advanced Analytics
- [ ] Interactive visualizations
- [ ] Comparative analysis tools
- [ ] Personalized recommendations
- [ ] Stack builder with interaction checking
- [ ] Cost-effectiveness analysis

### Phase 4: Community Features
- [ ] User reviews and experiences
- [ ] Expert verification system
- [ ] Community-contributed dosage protocols
- [ ] Discussion forums
- [ ] Research collaboration tools

## 🤝 Contributing

Contributions welcome! Areas for improvement:

1. **Data Sources**: Add more supplement databases
2. **AI Models**: Improve evidence extraction
3. **Frontend**: Build out React UI
4. **Testing**: Add unit and integration tests
5. **Documentation**: Expand API docs and examples

## 📄 License

MIT License - Free for educational and research use.

## 📧 Contact

Created by [@z0d1a](https://github.com/z0d1a)

---

**Evidence-Based Supplementation. 🔬**
