#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hamly.app Auto Push Script
سكريبت الدفع التلقائي لمشروع Hamly.app
"""

import subprocess
import sys
import os
import time
from datetime import datetime
import logging

# إعداد الـ logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('auto_push.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class AutoPusher:
    def __init__(self):
        self.repo_path = os.getcwd()
        self.branch = "main"
        self.remote = "origin"
        
    def run_command(self, command, description=""):
        """تنفيذ أمر Git مع معالجة الأخطاء"""
        try:
            logging.info(f"🔄 {description}")
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=self.repo_path,
                capture_output=True, 
                text=True,
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                logging.info(f"✅ نجح: {description}")
                if result.stdout.strip():
                    logging.info(f"📤 الإخراج: {result.stdout.strip()}")
                return True
            else:
                logging.error(f"❌ فشل: {description}")
                logging.error(f"🚨 خطأ: {result.stderr.strip()}")
                return False
                
        except Exception as e:
            logging.error(f"❌ استثناء في {description}: {str(e)}")
            return False
    
    def check_git_status(self):
        """فحص حالة Git"""
        return self.run_command("git status --porcelain", "فحص حالة المستودع")
    
    def add_all_changes(self):
        """إضافة جميع التغييرات"""
        return self.run_command("git add -A", "إضافة جميع التغييرات")
    
    def commit_changes(self, message=None):
        """عمل commit للتغييرات"""
        if not message:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            message = f"Auto push - {timestamp}"
        
        return self.run_command(f'git commit -m "{message}"', f"عمل commit: {message}")
    
    def push_to_remote(self):
        """دفع التغييرات إلى GitHub"""
        return self.run_command(f"git push {self.remote} {self.branch}", f"دفع إلى {self.remote}/{self.branch}")
    
    def auto_push(self, custom_message=None):
        """الدفع التلقائي الكامل"""
        logging.info("🚀 بدء الدفع التلقائي...")
        logging.info(f"📁 مسار المستودع: {self.repo_path}")
        logging.info(f"🌿 الفرع: {self.branch}")
        
        # فحص حالة Git
        if not self.check_git_status():
            logging.error("❌ فشل في فحص حالة Git")
            return False
        
        # إضافة التغييرات
        if not self.add_all_changes():
            logging.error("❌ فشل في إضافة التغييرات")
            return False
        
        # عمل commit
        if not self.commit_changes(custom_message):
            logging.error("❌ فشل في عمل commit")
            return False
        
        # دفع التغييرات
        if not self.push_to_remote():
            logging.error("❌ فشل في دفع التغييرات")
            return False
        
        logging.info("🎉 تم الدفع بنجاح!")
        return True
    
    def interactive_push(self):
        """دفع تفاعلي مع رسالة مخصصة"""
        print("\n" + "="*50)
        print("🚀 Hamly.app Auto Push Tool")
        print("="*50)
        
        # عرض التغييرات الحالية
        print("\n📋 التغييرات الحالية:")
        subprocess.run("git status", shell=True, cwd=self.repo_path)
        
        # طلب رسالة commit
        message = input("\n💬 أدخل رسالة commit (أو اضغط Enter للرسالة التلقائية): ").strip()
        
        if not message:
            message = None
        
        # تأكيد الدفع
        confirm = input(f"\n❓ هل تريد المتابعة مع الدفع إلى {self.remote}/{self.branch}? (y/n): ").strip().lower()
        
        if confirm in ['y', 'yes', 'نعم', 'ن']:
            return self.auto_push(message)
        else:
            print("❌ تم إلغاء العملية")
            return False

def main():
    """الدالة الرئيسية"""
    pusher = AutoPusher()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive" or sys.argv[1] == "-i":
            # وضع تفاعلي
            pusher.interactive_push()
        elif sys.argv[1] == "--help" or sys.argv[1] == "-h":
            # عرض المساعدة
            print("""
🚀 Hamly.app Auto Push Tool

الاستخدام:
  python auto_push.py                 # دفع تلقائي سريع
  python auto_push.py -i             # دفع تفاعلي مع رسالة مخصصة
  python auto_push.py --help         # عرض هذه المساعدة

الميزات:
  ✅ إضافة جميع التغييرات تلقائياً
  ✅ رسائل commit تلقائية مع الوقت
  ✅ تسجيل مفصل للعمليات
  ✅ معالجة الأخطاء
  ✅ وضع تفاعلي للتحكم الكامل
            """)
        else:
            # رسالة مخصصة
            message = " ".join(sys.argv[1:])
            pusher.auto_push(message)
    else:
        # دفع تلقائي سريع
        pusher.auto_push()

if __name__ == "__main__":
    main()
