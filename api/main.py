"""
api/main.py
FastAPI application entry point for AgentBreak.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.deps import is_fake_mode
from api.routes import attacks, defenses, findings, traces

app = FastAPI(
    title="AgentBreak API",
    description="Backend API for AgentBreak: Autonomous AI Red Team Framework",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(traces.router)
app.include_router(attacks.router)
app.include_router(defenses.router)
app.include_router(findings.router)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint providing runtime operational status."""
    return {
        "status": "healthy",
        "service": "AgentBreak API",
        "fake_mode": is_fake_mode(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
