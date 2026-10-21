@echo off
setlocal enabledelayedexpansion
title Materiaalonderhoud - lokaal draaien

rem Dit bestand is bewust zo klein mogelijk en hoort niet meer te veranderen.
rem Het haalt alleen de laatste versie van GitHub op en start daarna
rem onderhoud-astro\draai-lokaal.bat, waar de eigenlijke logica in zit.
rem
rem Waarom die scheiding? Dit bestand overschreef zichzelf vroeger terwijl
rem het nog liep (de git-stap haalde een nieuwe versie van ditzelfde bestand
rem binnen). Windows raakt dan de weg kwijt in wat er nog moet gebeuren en
rem voert kapotte restjes van het oude en nieuwe bestand door elkaar uit. Door
rem het ophalen en het echte werk in twee aparte bestanden te zetten, is dit
rem bestand allang klaar met zichzelf voordat het andere bestand - dat wel
rem gerust mag meeveranderen - voor het eerst wordt gelezen.
cd /d "%~dp0"

echo.
echo ==========================================
echo   Materiaalonderhoud - lokaal draaien
echo ==========================================
echo.

echo [1/2] Laatste wijzigingen ophalen van GitHub...
where git >nul 2>nul
if errorlevel 1 (
  echo       Git is niet gevonden - deze stap wordt overgeslagen.
) else (
  for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set HUIDIGE_BRANCH=%%b
  if not defined HUIDIGE_BRANCH (
    echo       Kon de huidige branch niet bepalen - deze stap wordt overgeslagen.
  ) else (
    git fetch --quiet origin
    if errorlevel 1 (
      echo.
      echo       Ophalen is niet gelukt - geen internetverbinding? De app start
      echo       met de versie die nu op deze computer staat.
    ) else (
      rem npm install kan hier zelf bestanden lichtjes aanpassen (bv.
      rem package-lock.json, door een andere npm-versie). Zo'n eigen wijziging
      rem blokkeert een gewone git pull stilletjes, waarna je op een oude
      rem versie blijft hangen zonder foutmelding. Deze map is geen plek om
      rem zelf in te bewerken - je eigen gegevens staan in de database, niet
      rem in bestanden die git bijhoudt - dus het is veilig om altijd gelijk
      rem te zetten met GitHub.
      git reset --hard --quiet origin/!HUIDIGE_BRANCH!
    )
  )
)

echo.
echo [2/2] App starten...
if not exist "onderhoud-astro\draai-lokaal.bat" (
  echo.
  echo [FOUT] onderhoud-astro\draai-lokaal.bat ontbreekt.
  echo        Zet start-website.bat terug in de hoofdmap van het project.
  echo.
  pause
  goto :einde
)
call "onderhoud-astro\draai-lokaal.bat"

:einde
endlocal
