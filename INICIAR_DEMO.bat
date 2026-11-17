@echo off
rem Inicia Enfermeria Academica en Windows. Primera vez: pide la contrasena de PostgreSQL y prepara la base.
chcp 65001 >nul
cd /d "%~dp0"
title Enfermeria Academica - v0.1

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Falta Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Instalando dependencias ^(requiere Internet solo esta vez^)...
  call npm install
  if errorlevel 1 ( echo  No se pudo ejecutar npm install. & pause & exit /b 1 )
)

if not exist .env (
  call node scripts\configurar.js
  if errorlevel 1 ( echo. & echo  La configuracion no termino. Revisa el mensaje anterior. & pause & exit /b 1 )
  if not exist .env ( echo. & echo  No se creo el archivo .env. & pause & exit /b 1 )
)

echo.
echo  Abriendo http://localhost:3000  ^(cierra esta ventana o pulsa Ctrl+C para detener el servidor^)
if not defined NO_BROWSER start "" http://localhost:3000
call npm start
pause
