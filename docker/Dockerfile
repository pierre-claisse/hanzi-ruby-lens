# escape=`
# ============================================================================
# Hanzi Ruby Lens — Build Toolchain Image
# Windows Server Core + VS Build Tools + Rust + Node.js + NSIS
# ============================================================================

FROM mcr.microsoft.com/windows/servercore:ltsc2022

SHELL ["cmd", "/S", "/C"]

# Enable long path support (prevents hcsshim::ImportLayer failures on deep VS paths)
RUN reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f

# --- Layer 1: Visual Studio Build Tools 2022 (largest, rarely changes) ---
# Exit code 3010 = success + reboot required (safe to ignore in Docker).
# Aggressive cleanup of installer caches to keep layer size manageable.
RUN curl -SL --output C:\vs_buildtools.exe https://aka.ms/vs/17/release/vs_buildtools.exe `
    && (start /w C:\vs_buildtools.exe --quiet --wait --norestart --nocache `
        --installPath "C:\VS" `
        --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
        --add Microsoft.VisualStudio.Component.Windows11SDK.22621 `
        --add Microsoft.VisualStudio.Component.VC.ATL `
        || IF "%ERRORLEVEL%"=="3010" EXIT 0) `
    && del /q C:\vs_buildtools.exe `
    & rmdir /s /q "%TEMP%" 2>nul `
    & rmdir /s /q "C:\ProgramData\Package Cache" 2>nul `
    & rmdir /s /q "C:\ProgramData\Microsoft\VisualStudio" 2>nul `
    & echo VS Build Tools installed successfully

# --- Layer 2: Rust stable (x86_64-pc-windows-msvc) ---
ENV RUSTUP_HOME="C:\rustup" `
    CARGO_HOME="C:\cargo"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

RUN Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile C:\rustup-init.exe ; `
    C:\rustup-init.exe -y --default-toolchain stable --default-host x86_64-pc-windows-msvc ; `
    Remove-Item -Force C:\rustup-init.exe

# --- Layer 3: Node.js LTS ---
RUN Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.13.0/node-v22.13.0-win-x64.zip' -OutFile C:\node.zip ; `
    Expand-Archive C:\node.zip -DestinationPath C:\ ; `
    Rename-Item 'C:\node-v22.13.0-win-x64' 'C:\nodejs' ; `
    Remove-Item -Force C:\node.zip

# --- Layer 4: NSIS (for installer bundling) ---
RUN curl.exe -SL -o C:\nsis.zip https://downloads.sourceforge.net/project/nsis/NSIS%203/3.10/nsis-3.10.zip ; `
    Expand-Archive C:\nsis.zip -DestinationPath C:\ ; `
    Rename-Item 'C:\nsis-3.10' 'C:\NSIS' ; `
    Remove-Item -Force C:\nsis.zip

# --- PATH ---
ENV PATH="C:\cargo\bin;C:\nodejs;C:\NSIS;${PATH}"

# --- Entrypoint: initializes MSVC environment before running commands ---
COPY entrypoint.cmd C:\entrypoint.cmd

WORKDIR C:\app

ENTRYPOINT ["C:\\entrypoint.cmd"]
CMD ["cmd", "/c", "echo Ready"]
