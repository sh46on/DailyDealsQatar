# Daily Deals Qatar — Fullstack Workflow Documentation

## Overview

This repository contains a fullstack web application for Daily Deals Qatar, featuring:

- **Backend:** Django REST API (Python)
- **Frontend:** React (Vite)

---

## Project Structure

```
DailyDeals/
├── Client/        # Frontend (React + Vite)
└── Server/        # Backend (Django)
```

---

## Backend (Django) Workflow

### 1. Setup

1. **Navigate to the backend directory:**
	```bash
	cd Server/dailydeals
	```
2. **Create and activate a virtual environment:**
	```bash
	python -m venv env
	# Windows:
	env\Scripts\activate
	# Linux/macOS:
	source env/bin/activate
	```
3. **Install dependencies:**
	```bash
	pip install -r requirements.txt
	```

### 2. Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
python manage.py runserver
```

### 5. API Endpoints

- Main API root: `/api/`
- Example endpoints:
  - `/api/home/` — Homepage data (companies, categories, products, flyers)
  - `/api/auth/login/` — User login
  - `/api/auth/register/` — User registration
  - `/api/auth/admin/` — Admin endpoints
  - `/api/auth/company/` — Company endpoints
  - `/api/auth/user/` — User endpoints

See `Server/dailydeals/deals_app/urls.py` for the full list.

---

## Frontend (React + Vite) Workflow

### 1. Setup

1. **Navigate to the frontend directory:**
	```bash
	cd Client
	```
2. **Install dependencies:**
	```bash
	npm install
	```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

---

## Application Workflow

### User Roles

- **Admin:** Manages users, companies, categories, flyers, and products.
- **Company:** Manages their own flyers and products.
- **User:** Browses, saves products/flyers, and manages their profile.

### Main Features

- **Authentication:** JWT-based login/register for all roles.
- **Marketplace:** Browse and search deals, flyers, and products.
- **Admin Panel:** Manage all data entities (users, companies, categories, flyers, products).
- **Company Portal:** Manage company profile, flyers, and products.
- **User Portal:** Save items, edit profile, and view personalized content.

### Data Flow

1. **Frontend** sends requests to the **Django REST API** for all data (auth, products, flyers, etc.).
2. **Backend** handles authentication, business logic, and database operations.
3. **Media files** (images, PDFs) are served from the `/media/` directory.

---

## Development Workflow

1. **Start backend server:**
	- `cd Server/dailydeals && env\Scripts\activate && python manage.py runserver`
2. **Start frontend server:**
	- `cd Client && npm run dev`
3. **Access the app:**
	- Frontend: [http://localhost:5173](http://localhost:5173)
	- Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)

---

## Deployment

1. **Build frontend:**
	```bash
	cd Client
	npm run build
	```
2. **Collect static files (Django):**
	```bash
	python manage.py collectstatic
	```
3. **Configure production server** (e.g., Gunicorn, Nginx, etc.)

---

## Notes

- Update `ALLOWED_HOSTS` and database settings in `Server/dailydeals/dailydeals/settings.py` for production.
- Media files are stored in `Server/dailydeals/media/`.
- For additional configuration, see the respective `README.md` files in `Client/` and `Server/`.

---

## License

This project is for educational and demonstration purposes.
# DailyDealsQatar
# DailyDealsQatar
# DailyDealsQatar
