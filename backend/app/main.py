"""FastAPI main application entrypoint for Wren Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, profile, telemetry, tutor, session

app = FastAPI(
    title="Wren Learning System API",
    description="Adaptive learning tutor backend for neurodivergent children.",
    version="0.1.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router)
app.include_router(profile.router)
app.include_router(telemetry.router)
app.include_router(tutor.router)
app.include_router(session.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Wren Adaptive Learning System API",
        "docs_url": "/docs",
        "health_url": "/health",
    }
