@echo off

REM Discover MSVC version (e.g. 14.44.35207)
for /d %%v in ("C:\VS\VC\Tools\MSVC\*") do set "MSVC_VER=%%~nxv"

set "MSVC_PATH=C:\VS\VC\Tools\MSVC\%MSVC_VER%"
set "SDK_PATH=C:\Program Files (x86)\Windows Kits\10"
set "SDK_VER=10.0.22621.0"

set "PATH=%MSVC_PATH%\bin\HostX64\x64;%PATH%"
set "LIB=%MSVC_PATH%\lib\x64;%MSVC_PATH%\atlmfc\lib\x64;%SDK_PATH%\Lib\%SDK_VER%\um\x64;%SDK_PATH%\Lib\%SDK_VER%\ucrt\x64"
set "INCLUDE=%MSVC_PATH%\include;%MSVC_PATH%\atlmfc\include;%SDK_PATH%\Include\%SDK_VER%\um;%SDK_PATH%\Include\%SDK_VER%\ucrt;%SDK_PATH%\Include\%SDK_VER%\shared"

%*
exit /b %ERRORLEVEL%
