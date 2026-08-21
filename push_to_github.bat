@echo off
echo Navigating to project directory and pushing to GitHub...
cd /d "C:\Users\nites\.gemini\antigravity\scratch\attendance-tracking-system"

set GIT_EXE=C:\Users\nites\.gemini\antigravity\scratch\git\cmd\git.exe

"%GIT_EXE%" remote set-url origin https://github.com/niteshgupta143/Attendance-tracking-system.git
"%GIT_EXE%" push -u origin main

echo.
echo If successful, your repository is live at:
echo https://github.com/niteshgupta143/Attendance-tracking-system.git
echo.
pause

