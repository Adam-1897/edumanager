@echo off
REM Starts the full EduManager app (MySQL must already be running).
REM For the no-server version, just open EduManager-Demo.html instead.
cd /d "%~dp0"

if not exist "backend\target\edumanager-backend-1.0.0.jar" (
  echo Backend jar not found. Build it first:  cd backend ^&^& mvn package -DskipTests
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd frontend && call npm install && popd
)

start "EduManager backend" cmd /k java -jar backend\target\edumanager-backend-1.0.0.jar
start "EduManager frontend" cmd /k "cd frontend && npm run dev"

echo Waiting for the servers to start...
timeout /t 20 /nobreak >nul
start "" http://localhost:5173
