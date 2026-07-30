# RentEase Technical Documentation

## Architecture

The Express server serves the frontend and exposes REST APIs under `/api`. Data is stored in the local SQLite database at `data/rentease.db`.

```text
Browser UI → Express REST API → SQLite database
```

## Database tables

| Table | Purpose |
|---|---|
| `users` | Customer and admin accounts |
| `products` | Product details, stock, pricing, and tenure plans |
| `rentals` | Orders, delivery, pickup, return, and rental status |
| `requests` | Maintenance and damage reports |
| `service_areas` | Supported delivery cities |

## Authentication

- Passwords are hashed using `bcryptjs`.
- Successful login returns a JWT valid for eight hours.
- Admin-only API routes require a JWT with the `admin` role.

## Main API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Create a customer account |
| `POST /api/auth/login` | Log in and receive a JWT |
| `GET /api/products` | Browse catalog |
| `POST/PUT/DELETE /api/products` | Admin inventory management |
| `GET/POST/PATCH /api/rentals` | Orders, pickup, extension, and return |
| `GET/POST/PATCH /api/requests` | Maintenance and damage workflow |
| `GET /api/users` | Admin user list |
| `GET/POST/DELETE /api/areas` | Service-area management |
| `GET /api/analytics` | Rental, revenue, retention, and resolution KPIs |

## Local setup

```powershell
npm.cmd install
npm.cmd start
```

Open `http://localhost:3000`.

## Demo admin account

- Email: `admin@rentease.demo`
- Password: `Admin@123`

## Deployment notes

Set `JWT_SECRET` to a long random value in the hosting environment. SQLite is ideal for the submitted local demo; use PostgreSQL or MongoDB for multi-user production deployment.
