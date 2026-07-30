# RentEase – Furniture & Appliance Rental Platform

RentEase is a full-stack rental platform for students and working professionals who need furniture and appliances without the cost and effort of buying them.

## Features

### Customer

- Secure registration and login with JWT sessions
- Furniture and appliance catalog with category filters
- Product details, monthly rent, security deposit, tenure plans, and stock availability
- Cart, checkout, delivery date, city, and address selection
- Active rentals, extension, pickup scheduling, and rental history
- Repair, pickup, extension, and damage support requests

### Admin

- Protected admin dashboard
- Add, edit, and remove inventory products
- Manage pricing, stock, and custom tenure options
- Monitor rentals, pickups, returns, and availability
- Resolve maintenance and damage requests
- Manage users and service areas
- Track active rentals, MRR, utilization, retention, and resolution-time KPIs

## Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js and Express
- Database: SQLite (`node:sqlite`)
- Authentication: JWT and bcryptjs

## Run locally

1. Open PowerShell in this folder.
2. Install packages:

   ```powershell
   npm.cmd install
   ```

3. Start the application:

   ```powershell
   npm.cmd start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Do not open `index.html` directly for the full-stack version; the Express server must be running.

## Demo admin login

- Email: `admin@rentease.demo`
- Password: `Admin@123`

## Project documents

- [PRD.md](PRD.md) – product requirements
- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) – architecture, database, and API reference

## Submission demo flow

1. Register a customer account.
2. Browse the catalog and place a rental order.
3. Schedule pickup in My Rentals.
4. Log in as admin and mark the rental returned.
5. Submit and resolve a maintenance or damage request.
6. Show inventory, users, service areas, and analytics in the Admin dashboard.

## Deployment

The app is ready to deploy as one Express web service. Set `JWT_SECRET` in your hosting environment; use `.env.example` as the variable reference. SQLite is suitable for a local submission demo. A production multi-user deployment should use PostgreSQL or MongoDB.
