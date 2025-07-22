@echo off
echo ========================================
echo     TT Management System
echo     Session Loader Script
echo ========================================
echo.

cd /d "f:\IIPS Summer Internship\TT-Management-System\backend"

REM Check if number of days is provided as argument
set DAYS=%1
if "%DAYS%"=="" set DAYS=10

echo Building the session loader...
go build -o load_sessions.exe scripts\load_sessions.go

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Please check the Go code for syntax errors.
    pause
    exit /b 1
)

echo Build successful!
echo.
echo Running session loader for the last %DAYS% days...
echo This will create session entries for all lectures scheduled in the last %DAYS% days.
echo.

if "%1"=="" (
    load_sessions.exe
) else (
    load_sessions.exe -days=%DAYS%
)

echo.
echo Cleaning up build files...
del load_sessions.exe

echo.
echo ========================================
echo Session loading completed!
echo ========================================
pause
