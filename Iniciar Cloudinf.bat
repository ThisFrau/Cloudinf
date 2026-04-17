@echo off
title Cloudinf - Servidor
color 0A
echo.
echo  ==============================================
echo   Cloudinf - Iniciando servidor...
echo   No cierres esta ventana mientras usas la app.
echo  ==============================================
echo.

cd /d "%~dp0"

:: Limpiar cache de Next.js si existe
if exist ".next" (
    echo  Limpiando cache...
    rmdir /s /q ".next"
)

:: Instalar dependencias si faltan
call npm install

:: Generar cliente de Prisma
call npx prisma generate

:: Abrir el navegador automaticamente
timeout /t 4 /nobreak >nul
start http://localhost:3000

:: Iniciar servidor de desarrollo
npm run dev

pause
