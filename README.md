# Invoice & Expense Manager

![Python](https://img.shields.io/badge/Python-3.11-blue) ![Django](https://img.shields.io/badge/Django-5.0-green) ![React](https://img.shields.io/badge/React-18-61DAFB) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

Full-stack invoice management system with PDF generation, expense tracking, and financial analytics tracking $50K+ in transactions.

**Live Demo:** [Frontend](https://your-app.vercel.app) | [Backend](https://your-api.onrender.com)

## Features
- Client management with revenue tracking
- Invoice CRUD with PDF generation (ReportLab)
- Line-item dynamic invoices with auto-calculated totals
- Expense categorization with CSV export
- Dashboard with P&L charts and revenue analytics
- JWT authentication

## Architecture
```
React (Vite + Tailwind) → Django REST API → PostgreSQL
      Vercel                   Render          Supabase
```

## Setup

### Backend
```bash
cd backend && pip install -r requirements.txt
cp .env.example .env
python manage.py migrate && python manage.py seed_data
python manage.py runserver
```

### Frontend
```bash
cd frontend && npm install
cp .env.example .env
npm run dev
```

## API Endpoints
| Endpoint | Description |
|----------|-------------|
| POST /api/auth/login/ | JWT login |
| GET/POST /api/invoices/ | List/create invoices |
| GET /api/invoices/{id}/pdf/ | Generate PDF |
| POST /api/invoices/{id}/mark-paid/ | Mark paid |
| GET /api/expenses/export_csv/ | Export CSV |
| GET /api/dashboard/summary/ | Dashboard stats |
| GET /api/reports/profit-loss/ | P&L report |
