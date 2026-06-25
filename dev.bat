@echo off
REM Run the CarBooking server (:3000) and client (:5173) together on Windows.
REM Opens each in its own console window.

set ROOT=%~dp0

if not exist "%ROOT%server\node_modules" (cd /d "%ROOT%server" && npm install)
if not exist "%ROOT%client\node_modules" (cd /d "%ROOT%client" && npm install)

echo ==> Starting server on http://localhost:3000
start "CarBooking Server" cmd /k "cd /d %ROOT%server && npm run dev"

echo ==> Starting client on http://localhost:5173
start "CarBooking Client" cmd /k "cd /d %ROOT%client && npm run dev"
