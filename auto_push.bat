@echo off
chcp 65001 >nul
title Hamly.app Auto Push Tool

echo.
echo ================================================
echo 🚀 Hamly.app Auto Push Tool
echo ================================================
echo.

REM التحقق من وجود Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python غير مثبت أو غير موجود في PATH
    echo 📥 يرجى تثبيت Python من: https://python.org
    pause
    exit /b 1
)

REM التحقق من وجود Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git غير مثبت أو غير موجود في PATH
    echo 📥 يرجى تثبيت Git من: https://git-scm.com
    pause
    exit /b 1
)

REM التحقق من وجود ملف auto_push.py
if not exist "auto_push.py" (
    echo ❌ ملف auto_push.py غير موجود
    echo 📁 تأكد من وجود الملف في نفس مجلد المشروع
    pause
    exit /b 1
)

echo ✅ Python و Git متوفران
echo 📁 المجلد الحالي: %CD%
echo.

REM تشغيل السكريبت
if "%1"=="-i" (
    echo 🔄 تشغيل الوضع التفاعلي...
    python auto_push.py --interactive
) else if "%1"=="--help" (
    python auto_push.py --help
) else (
    echo 🔄 تشغيل الدفع التلقائي...
    python auto_push.py %*
)

echo.
echo ✅ انتهت العملية
pause
