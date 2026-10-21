@echo off
setlocal
rem Wordt aangeroepen door ..\start-website.bat, nadat die de laatste versie
rem al heeft opgehaald. Dit bestand mag dus gerust meeveranderen bij een
rem update - het wordt pas gelezen nadat het ophalen al klaar is.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [FOUT] Node.js is niet gevonden.
  echo        Installeer de LTS-versie via https://nodejs.org en start dit
  echo        bestand daarna opnieuw.
  goto :einde
)

rem Geen .wrangler-map betekent: nog nooit een database op deze computer.
set EERSTEKEER=0
if not exist ".wrangler" set EERSTEKEER=1

echo [1/3] Pakketten controleren...
if exist "node_modules" (
  echo       Al aanwezig.
) else (
  call npm install
  if errorlevel 1 goto :fout
  rem npm 11 houdt installatiescripts tegen tot ze zijn goedgekeurd; zonder
  rem die goedkeuring ontbreken esbuild en workerd. Oudere npm kent deze
  rem opdracht niet - de melding daarover mag je negeren.
  call npm approve-scripts --all
)

echo.
echo [2/3] Database bijwerken...
call npm run db:migrate
if errorlevel 1 goto :fout

if "%EERSTEKEER%"=="1" (
  echo.
  echo       Eerste keer op deze computer: de database wordt gevuld met de
  echo       voorbeeldgegevens.
  echo.
  call npm run seed
  if errorlevel 1 goto :fout
)

echo.
echo [3/3] De app draait zo op http://localhost:4321
echo       Laat dit venster openstaan. Stoppen: Ctrl+C en daarna J.
echo.

rem De browser pas openen als de server waarschijnlijk luistert.
start "" /b cmd /c "timeout /t 8 /nobreak >nul 2>nul || ping -n 9 127.0.0.1 >nul & start http://localhost:4321"

call npm run dev
goto :einde

:fout
echo.
echo [FOUT] Er ging iets mis - de melding hierboven vertelt wat.

:einde
echo.
pause
endlocal
