from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import all your API modules
from api.routes import compounds, studies, search
from database.database import engine, test_connection
from database.models import Base

# Create FastAPI app
app = FastAPI(
    title="Supplement Research API",
    description="Evidence-based supplement research platform powered by AI",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.com"  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Supplement Research API v1.0.0",
        "status": "active",
        "docs": "/api/docs",
        "endpoints": {
            "compounds": "/api/compounds",
            "studies": "/api/studies", 
            "search": "/api/search"
        }
    }

@app.get("/health")
async def health_check():
    db_healthy = test_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": "supplement-research-api",
        "database": "healthy" if db_healthy else "error"
    }

# Mount all API routes
app.include_router(compounds.router, prefix="/api", tags=["compounds"])
app.include_router(studies.router, prefix="/api", tags=["studies"])
app.include_router(search.router, prefix="/api", tags=["search"])

# Startup event
@app.on_event("startup")
async def startup_event():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("🚀 Supplement Research API started successfully!")
    print("📊 Available endpoints:")
    print("   • Compounds: http://localhost:8000/api/compounds")
    print("   • Studies: http://localhost:8000/api/studies")
    print("   • Search: http://localhost:8000/api/search")
    print("   • API Docs: http://localhost:8000/api/docs")

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
