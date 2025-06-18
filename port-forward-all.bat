@echo off
echo Starting port forwarding for all services...

:: Open new command prompt window for server API
start cmd /k "echo Forwarding server API to http://localhost:3000 && .\kubectl.exe port-forward service/server 3000:3000"

:: Wait a moment to avoid overlapping windows
timeout /t 1 >nul

:: Open new command prompt window for client1
start cmd /k "echo Forwarding client1 to http://localhost:8081 && .\kubectl.exe port-forward service/client1 8081:80"

:: Wait a moment to avoid overlapping windows
timeout /t 1 >nul

:: Open new command prompt window for client2
start cmd /k "echo Forwarding client2 to http://localhost:8082 && .\kubectl.exe port-forward service/client2 8082:80"

:: Wait a moment to avoid overlapping windows
timeout /t 1 >nul

:: Open new command prompt window for client3
start cmd /k "echo Forwarding client3 to http://localhost:8083 && .\kubectl.exe port-forward service/client3 8083:80"

echo.
echo Port forwarding started in separate windows.
echo.
echo You can access your services at:
echo   - Server API: http://localhost:3000
echo   - Client 1:   http://localhost:8081
echo   - Client 2:   http://localhost:8082
echo   - Client 3:   http://localhost:8083
echo.
echo To stop port forwarding, close the respective command prompt windows. 