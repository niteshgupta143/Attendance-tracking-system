@echo off
echo Initializing Git repository and pushing to GitHub...
cd /d "C:\Users\nites\.gemini\antigravity\scratch\attendance-tracking-system"

set GIT_CMD=git
if exist "C:\Users\nites\.gemini\antigravity\scratch\git\cmd\git.exe" (
    set GIT_CMD="C:\Users\nites\.gemini\antigravity\scratch\git\cmd\git.exe"
)

%GIT_CMD% init
%GIT_CMD% config user.name "Nitesh Gupta"
%GIT_CMD% config user.email "niteshgupta143@gmail.com"
%GIT_CMD% add .
%GIT_CMD% commit -m "Initial commit: StellarAttend Attendance Tracking System on Stellar Testnet with Freighter Wallet"
%GIT_CMD% branch -M main
%GIT_CMD% remote remove origin >nul 2>&1
%GIT_CMD% remote add origin https://github.com/niteshgupta143/Attendance-tracking-system.git
%GIT_CMD% push -u origin main --force

echo.
echo Done! Pushed to https://github.com/niteshgupta143/Attendance-tracking-system.git
pause
