@echo off
title ShuttlePulse Badminton Organizer & Referee CRM Launcher
echo ====================================================================
echo   ShuttlePulse — Standalone Badminton Organizer ^& Referee CRM
echo ====================================================================
echo.

if not exist "server\node_modules" (
  echo [1/3] Installing server dependencies...
  cd server && call npm install && cd ..
)

if not exist "client\node_modules" (
  echo [2/3] Installing client dependencies...
  cd client && call npm install && cd ..
)

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
)

echo [3/3] Starting local DynamoDB (Port 8000), Express API (Port 5000) and Website (Port 5174)...
start "Local DynamoDB" cmd /k "cd server && npm run dev:local-db"
timeout /t 3 >nul
start "ShuttlePulse API Server" cmd /k "cd server && npm run dev"
timeout /t 4 >nul
start "ShuttlePulse Website Client" cmd /k "cd client && npm run dev"
timeout /t 3 >nul
start http://localhost:5174/
echo.
echo Badminton Tournament Website opened at http://localhost:5174/
pause
