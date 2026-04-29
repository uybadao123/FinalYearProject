# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api import crop, garden, soil, user, weather, dss, location
import time

load_dotenv() # Load environment variables from .env file


app = FastAPI(title="Urban Horticulture Backend API", version="beta-0.2")

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Register
app.include_router(crop.router, prefix="/api/v1/crop", tags=["Crop API"])
app.include_router(soil.router, prefix="/api/v1/soil", tags=["Physical Soil API"])
app.include_router(dss.router, prefix="/api/v1/dss", tags=["Decision Support System API"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["Weather API"])
app.include_router(garden.router, prefix="/api/v1/garden", tags=["Garden Management API"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User Management API"])
app.include_router(location.router, prefix="/api/v1/location", tags=["Location API"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Input logging
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    # Log response information and processing time
    print(f"Path: {request.url.path} | Method: {request.method} | Status: {response.status_code} | Time: {process_time:.2f}ms")

    
    return response