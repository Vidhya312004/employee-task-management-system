Employee Task Management System built with Angular, Laravel, and MySQL for managing employees, projects, task assignments, and progress tracking.
## Features

- User Authentication (Admin & Employee)
- Employee Management
- Project Management
- Task Assignment
- Task Status Tracking
- Dashboard Analytics
- Role-Based Access Control
- Profile Management
- Secure API Integration
- ## Technologies Used

Frontend:
- Angular
- TypeScript
- Bootstrap

Backend:
- Laravel
- PHP

Database:
- MySQL

Version Control:
- Git & GitHub
- # Installation Guide

## Prerequisites

Make sure the following software is installed:

- Node.js
- Angular CLI
- PHP 8.x
- Composer
- MySQL
- Git

---

## Clone the Repository

```bash
git clone https://github.com/Vidhya312004/employee-task-management-system.git
cd employee-task-management-system
```

---

## Frontend Setup (Angular)

```bash
cd taskmanagement
npm install
ng serve
```

Frontend will run at:

```
http://localhost:4200
```

---

## Backend Setup (Laravel)

Open a new terminal:

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configure database settings in `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=employee_task_management
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations:

```bash
php artisan migrate
```

(Optional) Seed sample data:

```bash
php artisan db:seed
```

Start Laravel server:

```bash
php artisan serve
```

Backend will run at:

```
http://127.0.0.1:8000
```

---

## Login Credentials

### Admin

```text
Email: admin@example.com
Password: password
```

### Employee

```text
Email: employee@example.com
Password: password
```

(Replace with your actual credentials)

---

## Technologies Used

- Angular
- TypeScript
- Laravel
- PHP
- MySQL
- Bootstrap
- GitHub
