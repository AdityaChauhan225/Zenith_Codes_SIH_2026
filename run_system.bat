@echo off
TITLE BACHAV Flash-Flood Emergency System Launcher
echo =====================================================================
echo           BACHAV - Flash Flood Early Warning System
echo =====================================================================
echo.

:: 1. Launch Unified Python Backend (ML Models + SOS + Shelters)
echo [*] Launching Unified Python FastAPI Backend (Port 5000)...
start "BACHAV Unified Backend (Port 5000)" cmd /k "python api_server.py"

:: 2. Launch Vite React Frontend
echo [*] Launching Vite React Frontend (Port 5173)...
start "BACHAV Frontend (Port 5173)" cmd /k "npm.cmd run dev"

echo.
echo =====================================================================
echo  Services launched in separate windows!
echo.
echo  Access Points:
echo  - Citizen & Authorities Frontend: http://localhost:5173/
echo  - Citizen Risk Dashboard:        http://localhost:5173/users/home
echo  - Tactical Command Hub:          http://localhost:5173/authorities/home
echo  - Backend API Health:            http://localhost:5000/api/health
echo  - Interactive API Docs:          http://localhost:5000/docs
echo =====================================================================
echo.
pause
