"""
Unified Python FastAPI Backend for BACHAV Flash-Flood Emergency System.

Integrates:
1. POST /api/predict: Accepts 12 hydrological features -> runs XGBoost model -> returns risk tier, calibrated score, and SHAP drivers.
2. POST /api/predict/live: Accepts GPS coordinates (lat, lon) -> executes live multi-source ingestion pipeline -> runs prediction.
3. POST /api/nowcast: Accepts 24h weather sequence (or simulates) -> runs PyTorch GRU recurrent nowcaster for 6h precipitation forecasts.
4. GET /api/health: Service health and ML model status check.
5. GET /api/shelters: Real-time Haversine distance calculations and nearest-first emergency shelter routing.
6. POST /api/sos, GET /api/sos, PATCH /api/sos/{id}/resolve: Emergency SOS alert intake, 3-second rapid-click deduplication, and Socket.IO live broadcasting.
7. Socket.IO: Real-time bi-directional events for authority dashboards.
8. Static Frontend: Serves user SOS and authority dashboard web interfaces.
"""

import os
import sys
import json
import math
import time
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, Request, HTTPException, Query, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

# Ensure root workspace has highest import precedence, followed by ml_database
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if _BASE_DIR in sys.path:
    sys.path.remove(_BASE_DIR)
sys.path.insert(0, _BASE_DIR)

_ML_DB_DIR = os.path.join(_BASE_DIR, "ml_database")
if _ML_DB_DIR not in sys.path:
    sys.path.append(_ML_DB_DIR)

# Import ML inference modules
from predict import predict_risk, validate_features, ALL_REQUIRED_FEATURES

predict_nowcast = None
try:
    from nowcast import predict_nowcast
except Exception as e:
    print(f"[WARN] Failed to load nowcast module: {e}")
    predict_nowcast = None

# Import Multi-source data ingestion pipeline
try:
    from ml_database.data_ingestion.assembler import assemble_features_from_coords
except Exception as e:
    print(f"[WARN] Failed to load assembler module: {e}")
    assemble_features_from_coords = None

# ================= Socket.IO & FastAPI Initialization ================= #

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
fastapi_app = FastAPI(
    title="BACHAV Unified Flood ML & SOS Backend",
    description="Unified Python service serving XGBoost Flash Flood predictions, PyTorch GRU precipitation nowcasting, and Real-time SOS dispatch.",
    version="2.0.0"
)

# Enable CORS for all frontends (Vite dev server, Vercel production, mobile apps)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Combined ASGI app handling both Socket.IO and FastAPI
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# ================= In-Memory Stores & Datasets ================= #

# SOS Alerts storage
sos_alerts: List[Dict[str, Any]] = []

# Emergency shelters dataset
shelters_data: List[Dict[str, Any]] = []
shelters_paths = [
    os.path.join(_BASE_DIR, "backend", "backend", "data", "shelters.json"),
    os.path.join(_BASE_DIR, "backend", "data", "shelters.json"),
    os.path.join(_BASE_DIR, "data", "shelters.json")
]
for p in shelters_paths:
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                shelters_data = json.load(f)
            print(f"[INFO] Loaded {len(shelters_data)} relief shelters from {p}")
            break
        except Exception as err:
            print(f"[ERROR] Could not load shelters from {p}: {err}")

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine formula to compute great-circle distance between two coordinates in kilometers.
    Matches backend/backend/server.js precision.
    """
    R = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

# ================= Socket.IO Event Handlers ================= #

@sio.event
async def connect(sid, environ):
    print(f"[SOCKET] Authority or User client connected: {sid}")
    # Immediately send existing active alerts on connection
    await sio.emit("initial_alerts", sos_alerts, to=sid)

@sio.event
async def disconnect(sid):
    print(f"[SOCKET] Client disconnected: {sid}")

# ================= Health & Status Endpoints ================= #

@fastapi_app.get("/api/health")
def health_check():
    """
    System Health Check endpoint. Validates backend availability and ML model readiness.
    """
    return {
        "status": "OK",
        "service": "SOS Flood Emergency Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "activeAlertsCount": len(sos_alerts),
        "models": {
            "xgboost_flash_flood": "ready",
            "gru_nowcaster": "ready" if predict_nowcast else "unavailable",
            "ingestion_assembler": "ready" if assemble_features_from_coords else "unavailable"
        }
    }

# ================= Shelters Routing Endpoint ================= #

@fastapi_app.get("/api/shelters")
def get_shelters(
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude")
):
    """
    Returns nearby emergency shelters. If latitude and longitude are supplied,
    calculates Haversine distance and returns the list sorted nearest-first.
    """
    if lat is None or lng is None:
        return {
            "success": True,
            "userLocation": None,
            "shelters": [{**s, "distanceKm": None} for s in shelters_data]
        }

    try:
        lat_num = float(lat)
        lng_num = float(lng)
    except (ValueError, TypeError):
        return {
            "success": True,
            "userLocation": None,
            "shelters": [{**s, "distanceKm": None} for s in shelters_data]
        }

    shelters_with_dist = []
    for shelter in shelters_data:
        dist = calculate_haversine_distance(
            lat_num, lng_num,
            float(shelter["latitude"]), float(shelter["longitude"])
        )
        shelters_with_dist.append({
            **shelter,
            "distanceKm": dist
        })

    # Sort nearest distance first
    shelters_with_dist.sort(key=lambda s: s["distanceKm"])

    return {
        "success": True,
        "userLocation": {"latitude": lat_num, "longitude": lng_num},
        "shelters": shelters_with_dist
    }

# ================= Emergency SOS Endpoints ================= #

@fastapi_app.post("/api/sos")
async def create_sos_alert(request: Request):
    """
    Receives emergency SOS distress signal.
    Applies coordinate validation (-90 to 90, -180 to 180) and 3-second deduplication.
    Broadcasts new alerts in real-time to all connected Socket.IO clients.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid JSON body."}
        )

    latitude = body.get("latitude")
    longitude = body.get("longitude")
    accuracy = body.get("accuracy")
    alert_id = body.get("id")
    info = body.get("info")
    alert_status = body.get("status")
    timestamp = body.get("timestamp")

    try:
        lat_num = float(latitude)
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid latitude. Must be a number between -90 and 90."}
        )

    try:
        lng_num = float(longitude)
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid longitude. Must be a number between -180 and 180."}
        )

    if lat_num < -90.0 or lat_num > 90.0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid latitude. Must be a number between -90 and 90."}
        )

    if lng_num < -180.0 or lng_num > 180.0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid longitude. Must be a number between -180 and 180."}
        )

    # 3-Second Deduplication Window
    now_epoch = time.time()
    for existing in sos_alerts:
        same_id = (alert_id is not None and existing.get("id") == alert_id)
        same_coords = (
            abs(existing["latitude"] - lat_num) < 1e-5 and
            abs(existing["longitude"] - lng_num) < 1e-5
        )
        is_recent = (now_epoch - existing.get("_received_epoch", 0.0)) < 3.0

        if same_id or (same_coords and is_recent):
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "message": "SOS Alert already processed",
                    "alert": {k: v for k, v in existing.items() if not k.startswith("_")}
                }
            )

    # Create new SOS record
    now_iso = datetime.now(timezone.utc).isoformat()
    sos_record = {
        "id": alert_id or f"sos_{int(now_epoch * 1000)}_{uuid.uuid4().hex[:5]}",
        "status": alert_status or "ACTIVE",
        "latitude": lat_num,
        "longitude": lng_num,
        "accuracy": float(accuracy) if accuracy is not None else None,
        "clientTimestamp": timestamp or now_iso,
        "receivedAt": now_iso,
        "_received_epoch": now_epoch,
        "info": info or "Flood Emergency Alert"
    }

    sos_alerts.insert(0, sos_record)
    clean_alert = {k: v for k, v in sos_record.items() if not k.startswith("_")}

    print(f"[ALERT] New SOS received! ID: {clean_alert['id']} at [{lat_num}, {lng_num}]")

    # Broadcast to authority dashboard via Socket.IO
    await sio.emit("new_sos_alert", clean_alert)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "SOS Alert successfully recorded and broadcasted to emergency authorities.",
            "alert": clean_alert
        }
    )

@fastapi_app.get("/api/sos")
def get_all_sos():
    """
    Returns all registered SOS distress alerts.
    """
    clean_alerts = [{k: v for k, v in a.items() if not k.startswith("_")} for a in sos_alerts]
    return {
        "success": True,
        "count": len(clean_alerts),
        "alerts": clean_alerts
    }

@fastapi_app.patch("/api/sos/{alert_id}/resolve")
async def resolve_sos_alert(alert_id: str):
    """
    Marks an SOS alert as RESOLVED and notifies all connected dashboards in real time.
    """
    target = None
    for a in sos_alerts:
        if a.get("id") == alert_id:
            target = a
            break

    if not target:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "error": "SOS Alert not found"}
        )

    target["status"] = "RESOLVED"
    target["resolvedAt"] = datetime.now(timezone.utc).isoformat()

    clean_target = {k: v for k, v in target.items() if not k.startswith("_")}
    print(f"[INFO] SOS Alert {alert_id} marked as RESOLVED")

    # Broadcast updated status
    await sio.emit("sos_status_updated", clean_target)

    return {
        "success": True,
        "message": "SOS alert resolved successfully",
        "alert": clean_target
    }

# ================= ML Model Prediction Endpoints ================= #

@fastapi_app.post("/api/predict")
async def predict_flash_flood_risk(request: Request):
    """
    POST /api/predict
    Accepts 12 hydrological and terrain features:
    - rainfall_1h_mm, rainfall_3h_mm, rainfall_6h_mm, rainfall_24h_mm
    - soil_saturation_index, slope_degrees, elevation_m, aspect
    - historical_incident_density, distance_to_nearest_stream_m
    - land_cover_class, antecedent_moisture_condition
    
    Returns:
    - risk_level: low | medium | high | critical
    - risk_score: calibrated continuous probability (0.01 - 0.99)
    - explanation: TreeSHAP feature contribution drivers
    - probabilities: Multiclass class probabilities
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid JSON body."}
        )

    features = body.get("features", body)

    try:
        result = predict_risk(features)
        
        # Sort feature drivers by absolute SHAP impact
        sorted_drivers = sorted(
            result.get("explanation", {}).items(),
            key=lambda item: abs(item[1]),
            reverse=True
        )

        return {
            "success": True,
            "risk_level": result["risk_level"],
            "risk_score": result["risk_score"],
            "explanation": result["explanation"],
            "top_drivers": [
                {"feature": k, "impact": v, "direction": "elevating" if v > 0 else "suppressing"}
                for k, v in sorted_drivers[:5]
            ],
            "probabilities": result.get("probabilities", {})
        }
    except ValueError as ve:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": str(ve)}
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": f"Inference execution failed: {str(exc)}"}
        )

@fastapi_app.post("/api/predict/live")
async def predict_flash_flood_live(request: Request):
    """
    POST /api/predict/live
    Accepts GPS coordinates:
    { "lat": float, "lon": float, "timestamp": optional str }
    
    Executes the multi-source telemetry ingestion pipeline:
    - Open-Meteo precipitation accumulations and soil saturation
    - OpenTopoData Copernicus 30m DEM elevation and slope
    - OpenStreetMap Overpass distance to nearest watercourses
    - OpenStreetMap Nominatim land cover classification
    - NASA EONET historical incident density
    
    Then runs the XGBoost model to produce an instant real-world risk score and SHAP breakdown.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Invalid JSON body."}
        )

    lat = body.get("lat") or body.get("latitude")
    lon = body.get("lon") or body.get("lng") or body.get("longitude")
    timestamp = body.get("timestamp")

    if lat is None or lon is None:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "lat and lon coordinates are required."}
        )

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "Latitude and longitude must be valid floating point numbers."}
        )

    if assemble_features_from_coords is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"success": False, "error": "Live ingestion assembler is unavailable."}
        )

    try:
        # Ingest 12 features from live APIs & local caches
        features = assemble_features_from_coords(lat_f, lon_f, timestamp)
        
        # Run prediction
        result = predict_risk(features)

        sorted_drivers = sorted(
            result.get("explanation", {}).items(),
            key=lambda item: abs(item[1]),
            reverse=True
        )

        return {
            "success": True,
            "coordinates": {"latitude": lat_f, "longitude": lon_f},
            "features": features,
            "risk_level": result["risk_level"],
            "risk_score": result["risk_score"],
            "explanation": result["explanation"],
            "top_drivers": [
                {"feature": k, "impact": v, "direction": "elevating" if v > 0 else "suppressing"}
                for k, v in sorted_drivers[:5]
            ],
            "probabilities": result.get("probabilities", {})
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": f"Live prediction failed: {str(exc)}"}
        )

@fastapi_app.post("/api/nowcast")
async def nowcast_precipitation(request: Request):
    """
    POST /api/nowcast
    Accepts 24 hours of 3-channel weather sequence:
    { "sequence": [[rain_mm, relative_humidity_pct, barometric_pressure_hpa], ... 24 rows] }
    
    Runs 2-layer GRU recurrent neural network to forecast 6-hour precipitation accumulation.
    """
    if predict_nowcast is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"success": False, "error": "Nowcast model is unavailable."}
        )

    try:
        body = await request.json()
    except Exception:
        body = {}

    seq = body.get("sequence")

    # If no sequence provided, generate a representative synthetic sequence
    if not seq or len(seq) != 24:
        import numpy as np
        # Afternoon monsoon convective sequence
        rain = [0.0]*12 + [0.5, 1.2, 3.5, 8.0, 14.5, 19.0, 15.0, 9.0, 4.0, 1.5, 0.5, 0.0]
        rh = list(np.linspace(65.0, 96.0, 24))
        pressure = list(np.linspace(882.0, 868.0, 24))
        seq = [[float(r), float(h), float(p)] for r, h, p in zip(rain, rh, pressure)]

    try:
        forecast = predict_nowcast(seq)
        return {
            "success": True,
            "timesteps_input": 24,
            "forecast_hours": 6,
            "forecast": forecast
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": f"Nowcast inference failed: {str(exc)}"}
        )

# ================= Static Assets & HTML Interface ================= #

frontend_dir = os.path.join(_BASE_DIR, "backend", "frontend")
if os.path.exists(frontend_dir):
    js_dir = os.path.join(frontend_dir, "js")
    css_dir = os.path.join(frontend_dir, "css")
    if os.path.exists(js_dir):
        fastapi_app.mount("/js", StaticFiles(directory=js_dir), name="frontend_js")
    if os.path.exists(css_dir):
        fastapi_app.mount("/css", StaticFiles(directory=css_dir), name="frontend_css")

    @fastapi_app.get("/")
    def serve_index():
        index_file = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "OK", "message": "BACHAV API Server Running"}

    @fastapi_app.get("/authority.html")
    def serve_authority():
        auth_file = os.path.join(frontend_dir, "authority.html")
        if os.path.exists(auth_file):
            return FileResponse(auth_file)
        return FileResponse(os.path.join(frontend_dir, "index.html"))

# ================= Server Execution ================= #

if __name__ == "__main__":
    import uvicorn
    import socket

    port = int(os.environ.get("PORT", 5000))
    print(f"\n==================================================")
    print(f"[INFO] UNIFIED FLASH-FLOOD ML & SOS API ONLINE")
    print(f"API Health:           http://localhost:{port}/api/health")
    print(f"XGBoost Predict:      http://localhost:{port}/api/predict")
    print(f"Live Ingest Predict:  http://localhost:{port}/api/predict/live")
    print(f"GRU Nowcast:          http://localhost:{port}/api/nowcast")
    print(f"Emergency Shelters:   http://localhost:{port}/api/shelters")
    print(f"SOS Distress:         http://localhost:{port}/api/sos")
    print(f"Authority Dashboard:  http://localhost:{port}/authority.html")
    print(f"==================================================\n")

    # Use dual-stack socket on Windows so localhost (::1) connects in <1ms without IPv6 fallback delay
    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        sock.bind(('::', port))
        sock.listen(128)
        config = uvicorn.Config("api_server:app", log_level="info")
        server = uvicorn.Server(config)
        server.run(sockets=[sock])
    except Exception as e:
        print(f"[INFO] Running default uvicorn bind: {e}")
        uvicorn.run("api_server:app", host="0.0.0.0", port=port, reload=False)
