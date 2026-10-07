# MedFlow Pro — Medical Billing & Revenue Management System

A production-grade EHR and Medical Revenue Cycle Management system with role-based dashboards, PostgreSQL + FastAPI backend, React + Vite frontend, and a dedicated real-time Socket.IO service.

---

## Architecture Overview

```
                               ┌────────────────────────────────┐
                               │   Frontend (React + Vite)      │
                               │   http://localhost:5173        │
                               └───────┬────────────────┬───────┘
                     REST (Auth, CRUD) │                │ WebSocket (Live Events)
                                       ▼                ▼
┌───────────────────────────────────────┐              ┌───────────────────────────────────────┐
│     Backend (FastAPI + SQLAlchemy)    │              │       Socket.IO Microservice          │
│     http://localhost:8000             │              │       http://localhost:4000           │
│     (PostgreSQL Database)             │              │       (Real-Time Broadcasts)          │
└───────────────────────────────────────┘              └───────────────────────────────────────┘
```

> **Note:** The backend remains untouched and strictly dedicated to data persistence and authentication. Real-time events, staff presence, live updates, and notification routing run seamlessly through the lightweight Node.js Socket.IO microservice.

---

## Quick Start (Running All Services)

Run each service in a separate terminal:

### 1. Backend (FastAPI)
```bash
cd backend
uv run uvicorn app.main:app --reload
```

### 2. Socket.IO Service (Real-Time Server)
```bash
cd socket-server
npm start
```
*(Runs on port `4000` with live presence, patient notifications, check-in tracking, and claim event routing.)*

### 3. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
*(Runs on port `5173`.)*

---

## Role Permissions & Features

| Role | Dashboard | Patients Access | Invoices / Payers | Scheduling | Notes & Coding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Revenue stats, AR days, Net collections | **View Only** | View Invoices & Payers | — | User Management (CRUD) |
| **Receptionist** | Check-ins, Pending appointments | **Full CRUD** (Add, Edit, Delete) | Insurers View Only | Full Scheduling & Intake | — |
| **Doctor** | In-session queues, My Patients | **View Only** | — | Appointment View | Clinical Notes |
| **Medical Coder**| ICD-10 / CPT Workbench | **View Only** | — | — | Coding Review |
| **Medical Biller**| Claim statuses, Denial queue | — | Full Invoices & Payers | — | Claims & Denials |

---

## Real-Time Features Enabled by Socket.IO
- **Live Notification Center:** Header bell with active badge counters and notification dismissal.
- **Connection Indicator:** Live/Offline status pill displayed in the navigation bar.
- **Patient Live Sync:** Auto-refreshes patient directories across active doctor/admin/receptionist sessions whenever a patient is registered, modified, or deleted.
- **Staff Presence:** Tracks active users and emits live sign-in/sign-out alerts to administrators.

