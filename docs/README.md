# EduManager — School Management System

> A full-stack school management platform built with **Spring Boot**, **React**, and **MySQL**. Replaces spreadsheet-based workflows with a live web dashboard covering students, teachers, classes, payments, expenses, events, and more.

---

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Running the Project](#running-the-project)
- [Default Credentials](#default-credentials)
- [API Overview](#api-overview)
- [Deployment (Optional)](#deployment-optional)

---

## Project Description

EduManager is a full-stack web application designed to streamline the day-to-day operations of a school or tutoring center. It provides an intuitive dashboard with live KPIs, and dedicated modules for managing students, teachers, class schedules, payments, expenses, events, and to-do lists.

All API routes are secured with **JWT authentication** and **role-based access control** (ADMIN / TEACHER / STAFF). The React frontend communicates with a Spring Boot REST API, and all data is persisted in a MySQL database.

---

## Features

| Module     | Description                                                         |
|------------|---------------------------------------------------------------------|
| Dashboard  | Live revenue, expenses, profit, unpaid students, and KPI cards      |
| Students   | Profiles, enrollment, attendance tracking, balance, and notes       |
| Teachers   | Profiles, salary tracking, assigned classes, and status             |
| Classes    | Schedule, teacher assignment, enrollment count, and monthly fee     |
| Payments   | Student payments, month coverage, payment method, unpaid tracking   |
| Expenses   | Category-based tracking (Rent / Utilities / etc.), vendor, totals   |
| Events     | Cost vs. revenue, profit analysis, participant count                |
| To-Do List | Personal task management per user                                   |
| Auth       | JWT login and role-based access (ADMIN / TEACHER / STAFF)           |

---

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Backend  | Java 23, Spring Boot 3.2.5, Spring Security       |
| Database | MySQL 8.0+                                        |
| ORM      | Spring Data JPA / Hibernate                       |
| Auth     | JWT via jjwt 0.11.5                               |
| Frontend | React 18, Vite 5                                  |

---

## Requirements

Make sure the following tools are installed on your machine before proceeding:

| Tool        | Minimum Version | Download                                  |
|-------------|-----------------|-------------------------------------------|
| Java (JDK)  | 17+             | https://adoptium.net                      |
| Apache Maven| 3.6+            | https://maven.apache.org/install.html     |
| MySQL       | 8.0+            | https://dev.mysql.com/downloads/          |
| Node.js     | 18+             | https://nodejs.org                        |
| npm         | 9+ (bundled with Node.js) | —                               |

To verify your installations, run:

```bash
java -version
mvn -version
mysql --version
node -v
npm -v
```

---

## Project Structure

```
edumanager/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/edumanager/
│       │   ├── EduManagerApplication.java
│       │   ├── config/
│       │   │   ├── DataSeeder.java
│       │   │   └── SecurityConfig.java
│       │   ├── controller/
│       │   │   ├── Controllers.java
│       │   │   └── NewControllers.java
│       │   ├── entity/
│       │   │   ├── AppUser.java
│       │   │   ├── Student.java
│       │   │   ├── Teacher.java
│       │   │   ├── SchoolClass.java
│       │   │   ├── Payment.java
│       │   │   ├── Expense.java
│       │   │   ├── SchoolEvent.java
│       │   │   ├── AttendanceRecord.java
│       │   │   ├── Note.java
│       │   │   └── Todo.java
│       │   ├── repository/
│       │   ├── security/
│       │   │   └── JwtUtil.java
│       │   └── service/
│       │       └── UserDetailsServiceImpl.java
│       └── resources/
│           └── application.properties
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx            (routing, auth, layout)
│       ├── main.jsx
│       ├── services/
│       │   └── api.js
│       ├── components/
│       │   └── UI.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Students.jsx
│           ├── Teachers.jsx
│           ├── Classes.jsx
│           ├── Payments.jsx
│           ├── Expenses.jsx
│           ├── Events.jsx
│           ├── Attendance.jsx
│           ├── Notes.jsx
│           └── TodoList.jsx
└── docs/
    ├── README.md
    └── schema.sql
```

---

## Quick Start

- **No setup:** double-click `EduManager-Demo.html` in the project root. It is the full frontend running
  against an in-browser demo backend (data is saved in that browser's localStorage). Rebuild it with
  `cd frontend && npm run build:demo`.
- **Full app:** with MySQL running and the backend jar built, double-click `start-edumanager.bat`.

---

## Running the Project

### Step 1 — Set Up the Database

Open a MySQL shell and run one of the following:

```sql
-- Option A: Run the full schema + seed data (recommended)
source /path/to/edumanager/docs/schema.sql

-- Option B: Create the database only (Spring Boot will create the tables automatically)
CREATE DATABASE edumanager;
```

### Step 2 — Configure the Backend

Copy `backend/src/main/resources/application-local.properties.example` to `application-local.properties`
in the same folder and fill in your values:

```properties
spring.datasource.password=YOUR_MYSQL_PASSWORD
jwt.secret=ANY_LONG_RANDOM_STRING_32_CHARS_OR_MORE
app.admin-password=CHOOSE_AN_ADMIN_PASSWORD
```

`application-local.properties` is git-ignored, so your secrets never get committed. The same values can
be given as environment variables instead (`DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`).

### Step 3 — Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will start at: **http://localhost:8080**

You can verify it is running by visiting: **http://localhost:8080/api/auth/login** (should return a 405 or 400, confirming the route exists).

### Step 4 — Run the Frontend

Open a **new terminal window**, then:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at: **http://localhost:5173**

Open your browser and navigate to **http://localhost:5173** to use the application.

> The Vite dev server is already configured to proxy all `/api` requests to `http://localhost:8080`, so no additional CORS setup is needed for local development.

---

## Default Credentials

There is no built-in password. On first start the backend creates an `admin` account:

- if `app.admin-password` (or the `ADMIN_PASSWORD` environment variable) is set, that is the password;
- otherwise a random password is generated and printed **once** in the backend console.

The offline demo (`EduManager-Demo.html`) uses `admin` / `admin123`; it has no server and no real data.

---

## API Overview

All endpoints except `/api/auth/login` require a JWT token in the request header (missing or expired tokens get `401`). `/api/auth/register` additionally requires an ADMIN token:

```
Authorization: Bearer <your_token>
```

| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| POST   | `/api/auth/login`                 | Login — returns JWT token     |
| POST   | `/api/auth/register`              | Create a new user             |
| GET    | `/api/dashboard/summary`          | All KPIs for the dashboard    |
| GET    | `/api/students`                   | List all students             |
| POST   | `/api/students`                   | Create a student              |
| PUT    | `/api/students/{id}`              | Update a student              |
| DELETE | `/api/students/{id}`              | Delete a student              |
| GET    | `/api/teachers`                   | List all teachers             |
| POST   | `/api/teachers`                   | Create a teacher              |
| GET    | `/api/classes`                    | List all classes              |
| GET    | `/api/payments`                   | List all payments             |
| GET    | `/api/payments/unpaid`            | List unpaid payments          |
| GET    | `/api/expenses`                   | List all expenses             |
| GET    | `/api/events`                     | List all events               |
| GET/POST | `/api/attendance?year=&month=`  | Read / save a month of attendance |
| CRUD   | `/api/notes`, `/api/todos`        | Notes and to-do items         |

> A class's *enrolled* count is the number of distinct students with a payment recorded for that class.

---

## Deployment (Optional)

### Backend → Render.com (free tier)

1. Push the project to a GitHub repository.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your repository and configure:
   - **Build command:** `cd backend && mvn package -DskipTests`
   - **Start command:** `java -jar backend/target/edumanager-backend-1.0.0.jar`
4. Add environment variables for your production database credentials (`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, etc.).

### Frontend → Vercel (free tier)

1. Build the frontend locally: `cd frontend && npm run build`
2. Push to GitHub.
3. Import the project at [vercel.com](https://vercel.com).
4. Set the environment variable `VITE_API_URL` to your Render backend URL.