@echo off
call "C:\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=amd64 -host_arch=amd64 >nul 2>&1
%*
exit /b %ERRORLEVEL%
