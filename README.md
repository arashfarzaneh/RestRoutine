# 🌙 RestRoutine

Sleep matters! both its duration and its timing.  
کیفیت زندگی شما به کیفیت خواب شما بستگی دارد؛ هم مدت زمان آن و هم تنظیم وقت آن.

[![Live Demo](https://img.shields.io/badge/demo-online-success.svg?style=for-the-badge)](https://arashfarzaneh.github.io/RestRoutine/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🎨 Visual Preview / پیش‌نمایش متنی

![RestRoutine Dashboard](assets/screenshot_collage.jpg)

---

## 🚀 Live Demonstration / دمو آنلاین

Try the application directly in your browser with zero setup required:  
برنامه را بدون نیاز به هیچ تنظیماتی مستقیماً در مرورگر خود امتحان کنید:  
👉 **[Launch RestRoutine Live Demo / ورود به نسخه نمایشی](https://arashfarzaneh.github.io/RestRoutine/)**

---

## 🇬🇧 English Description

RestRoutine is an elegant client-side sleep tracker and routine optimizer. It features native calendar support, habit logging, mood mapping, and a custom sleep-scoring calculator.

### ✨ Key Features
* **Data-Driven Sleep Scoring:** Rates your sleep using an algorithm that factors in both total duration ($40\%$) and the consistency of your sleep window timings ($60\%$).
* **Shamsi (Jalaali) Calendar Support:** Built natively to handle calendar views and record dates seamlessly using the Shamsi system.
* **Routine & Habit Tracker:** Log daily routines (Completed `✓`, Partial `~`, Failed `✕`) to visually correlate how your daytime habits impact your rest.
* **Visual Time-blocking:** Displays an hourly timeline tracking card for every entry to give you an immediate visual overview of your sleep patterns.
* **Local Privacy:** 100% client-side. Your data never leaves your browser; it is stored securely via `localStorage` and includes simple `.json` export/import tools for backups.

---

## 🇮🇷 معرفی به زبان فارسی (Persian)

یک ابزار هوشمند، زیبا و کاملاً مستقل برای پیگیری وضعیت خواب و بهینه‌سازی روتین‌های روزانه. این برنامه به شما کمک می‌کند تا نظم خواب خود را بر پایه تقویم شمسی تحلیل کنید، عادات روزانه خود را ثبت کنید و کیفیت استراحت خود را بهبود ببخشید.

### ✨ قابلیت‌های کلیدی
* **محاسبه هوشمند امتیاز خواب:** سنجش دقیق کیفیت خواب با استفاده از فرمول اختصاصی که مدت زمان خواب ($40\%$) و منظم بودن زمان خواب و بیداری ($60\%$) را محاسبه می‌کند.
* **پشتیبانی بومی از تقویم شمسی:** طراحی اختصاصی برای نمایش ماهانه و ثبت داده‌ها کاملاً هماهنگ با گاه‌شماری هجری شمسی (جلالی).
* **سیستم ردیابی عادات و روتین‌ها:** ثبت فعالیت‌های روزانه (انجام شده `✓`، ناقص `~`، انجام نشده `✕`) برای درک بهتر تاثیر رفتار روزانه بر کیفیت خواب شبانه.
* **نمودار زمانی بصری (Time-blocking):** نمایش خط زمان ۲۴ ساعته برای هر ورودی جهت ارزیابی و مقایسه سریع الگوهای خواب در یک نگاه.
* **حفظ کامل حریم خصوصی:** برنامه ۱۰۰٪ سمت کاربر اجرا می‌شود. داده‌های شما هرگز از مرورگر خارج نشده و به هیچ سروری ارسال نمی‌شوند؛ اطلاعات در حافظه محلی مروگر (`localStorage`) ذخیره شده و امکان خروجی/ورودی گرفتن به صورت فایل `.json` جهت پشتیبان‌گیری وجود دارد.

---

## 🏗️ Architecture & Codebase Structure / ساختار سورس‌کد

The project is built using decoupled vanilla JavaScript modules organized under a single global namespace (`window.SleepApp`).  
پروژه با استفاده از ماژول‌های مجزای جاوااسکریپت خام (Vanilla JS) پیاده‌سازی شده و تحت یک فضای نام سراسری مدیریت می‌شود.

```text
.
├── css
│   └── style.css       # Modern, clean variable-based stylesheet / استایل‌شیت مدرن و داینامیک
├── index.html          # Semantic HTML5 layout structure / ساختار استاندارد صفحات وب
├── js
│   ├── app.js          # Initialization, event listeners, and main views / مدیریت نماها و رویدادها
│   ├── calendar.js     # Monthly grid renderer and navigation / رندر تقویم ماهانه و جابجایی بین ماه‌ها
│   ├── modal.js        # Form inputs, validation, and details / مدیریت فرم‌ها و اعتبارسنجی داده‌ها
│   ├── scoring.js      # Scoring math and duration calculation / محاسبات امتیازدهی و طول مدت خواب
│   ├── storage.js      # Interface for LocalStorage and backups / مدیریت حافظه مرورگر و پشتیبان‌گیری
│   └── timeline.js     # Renders the visual hourly timeline blocks / رندر گرافیکی خط زمان ورودی‌ها
└── lib
    └── jalaali.js      # Calendar conversion algorithm utility / کتابخانه تبدیل توابع تقویم جلالی
