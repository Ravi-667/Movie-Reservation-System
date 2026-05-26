# 🎬 Movie Reservation System

A production-ready RESTful API for movie ticket reservation built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. Features JWT authentication, role-based access control, seat-level booking with concurrency protection, and simulated Stripe payment processing.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Booking Flow](#-booking-flow)
- [Concurrency & Safety](#-concurrency--safety)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [License](#-license)

---

## ✨ Features

| Category | Details |
|----------|---------|
| **Authentication** | JWT-based registration & login with bcrypt password hashing |
| **Authorization** | Role-based access control (CUSTOMER / ADMIN) |
| **Movies** | CRUD with search by title, genre, and release date range |
| **Theaters & Screens** | Multi-theater support with configurable screens and auto-generated seat maps |
| **Showtimes** | Schedule management with automatic overlap detection (includes 20-min cleaning buffer) |
| **Seat Reservation** | Real-time seat availability, atomic booking with double-booking prevention |
| **Expiry System** | Pending reservations auto-expire after 10 minutes via lazy cleanup |
| **Payments** | Simulated Stripe payment flow with ownership verification and ticket generation |
| **Concurrency Control** | Prisma `$transaction` with `@@unique` constraints prevent race conditions |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Auth | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| Payments | Stripe SDK (simulated) |
| Containerization | Docker Compose |
| Dev Tools | nodemon, ts-node |

---

## 🏗 Architecture

```
Client → Express Router → Auth Middleware → Controller → Prisma ORM → PostgreSQL
```

- **Controllers** handle business logic and validation
- **Middleware** handles JWT verification and role authorization
- **Prisma** manages database access with type-safe queries and transactions
- **Database constraints** (`@@unique`) provide the final safety net against race conditions

---

## 🗄 Database Schema

```
User ──< Reservation ──< SeatReservation >── Seat
              │                  │
              │                  └──── Showtime >── Screen >── Theater
              │                            │
              └──── Payment                └──── Movie
```

### Models

| Model | Purpose |
|-------|---------|
| **User** | Customer/Admin accounts with hashed passwords |
| **Movie** | Film catalog with title, duration, genre, poster |
| **Theater** | Physical venue with location |
| **Screen** | Screening room (IMAX, 3D, etc.) belonging to a theater |
| **Seat** | Individual seat (row + number + type) on a screen |
| **Showtime** | Scheduled screening (movie + screen + time + price) |
| **Reservation** | Booking record with status lifecycle: `PENDING → CONFIRMED / EXPIRED / CANCELLED` |
| **SeatReservation** | Join table linking seats to reservations for a showtime (`@@unique[showtimeId, seatId]`) |
| **Payment** | Transaction record linked to a reservation |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (for PostgreSQL)
- **npm** ≥ 9

### 1. Clone the Repository

```bash
git clone https://github.com/Ravi-667/Movie-Reservation-System.git
cd Movie-Reservation-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/movie_reservation?schema=public"
JWT_SECRET="your-strong-secret-key"
PORT=3000
```

### 4. Start PostgreSQL

```bash
docker compose up -d
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

### 6. Seed the Database (Optional)

```bash
npm run seed
```

This creates sample movies (Inception, The Dark Knight), a theater with an IMAX screen, and 50 seats (5 rows × 10 columns).

### 7. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm run build
npm start
```

Server runs at `http://localhost:3000`

---

## 📡 API Reference

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | `{ email, password, name?, role? }` | Register a new user |
| `POST` | `/auth/login` | `{ email, password }` | Login and receive JWT |

### Movies 🔒 Admin (POST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/movies` | Create a movie |
| `GET` | `/api/movies` | List movies (query: `search`, `genre`, `startDate`, `endDate`) |
| `GET` | `/api/movies/:id` | Get movie details with showtimes |

### Theaters & Screens 🔒 Admin (POST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/theaters` | Create a theater |
| `GET` | `/api/theaters` | List all theaters with screens |
| `POST` | `/api/theaters/:theaterId/screens` | Create screen with auto-generated seats |
| `GET` | `/api/theaters/screens/:id` | Get screen details with seat map |

**Create Screen Body:**
```json
{
  "number": 1,
  "type": "IMAX",
  "rows": ["A", "B", "C", "D", "E"],
  "columns": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

### Showtimes 🔒 Admin (POST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/showtimes` | Create showtime (auto-calculates endTime with 20-min buffer) |
| `GET` | `/api/showtimes` | List showtimes (query: `movieId`, `date`) |

### Reservations 🔒 Auth (POST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reservations/showtime/:showtimeId` | Get seat availability map |
| `POST` | `/api/reservations` | Create reservation (locks seats for 10 min) |

**Create Reservation Body:**
```json
{
  "showtimeId": 1,
  "seatIds": [1, 2, 3]
}
```

### Payments 🔒 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/confirm` | Confirm payment and generate ticket |

**Confirm Payment Body:**
```json
{
  "reservationId": 1,
  "paymentToken": "tok_visa_dummy"
}
```

> Use `"fail_token"` as `paymentToken` to simulate a failed payment.

---

## 🎯 Booking Flow

```
1. Browse Movies      GET /api/movies
2. View Showtimes     GET /api/showtimes?movieId=1
3. Check Seats        GET /api/reservations/showtime/1
4. Reserve Seats      POST /api/reservations        → status: PENDING (10 min lock)
5. Make Payment       POST /api/payments/confirm     → status: CONFIRMED + ticket ID
```

### Reservation Status Lifecycle

```
PENDING ──→ CONFIRMED  (payment successful)
   │
   ├──→ CANCELLED  (payment failed or user cancelled)
   │
   └──→ EXPIRED    (10-minute timeout exceeded)
```

---

## 🔒 Concurrency & Safety

| Mechanism | Purpose |
|-----------|---------|
| **Prisma `$transaction`** | Atomic seat checking + reservation creation |
| **`@@unique([showtimeId, seatId])`** | Database-level double-booking prevention |
| **Lazy expiry cleanup** | Expired PENDING reservations are marked EXPIRED and their seat locks released on the next booking attempt |
| **Ownership verification** | Users can only pay for their own reservations |
| **JWT + role middleware** | Route-level access control |

---

## 📁 Project Structure

```
Movie-Reservation-System/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Sample data seeder
│   └── migrations/            # Database migration history
├── src/
│   ├── app.ts                 # Express app configuration & routes
│   ├── server.ts              # Server entry point with graceful shutdown
│   ├── prisma.ts              # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.ts        # Register & login
│   │   ├── movie.controller.ts       # Movie CRUD + search
│   │   ├── theater.controller.ts     # Theater & screen management
│   │   ├── showtime.controller.ts    # Showtime scheduling
│   │   ├── reservation.controller.ts # Seat booking & availability
│   │   └── payment.controller.ts     # Payment processing
│   ├── middlewares/
│   │   └── auth.middleware.ts        # JWT verification & admin guard
│   └── routes/
│       ├── auth.routes.ts
│       ├── movie.routes.ts
│       ├── payment.routes.ts
│       ├── reservation.routes.ts
│       ├── showtime.routes.ts
│       └── theater.routes.ts
├── docker-compose.yml         # PostgreSQL container
├── prisma.config.ts           # Prisma configuration
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variable template
├── package.json
└── README.md
```

---

## 🧪 Testing

PowerShell test scripts are included for manual integration testing:

| Script | Tests |
|--------|-------|
| `test-concurrency.ps1` | Seat booking, availability check, double-booking prevention |
| `test-payment.ps1` | End-to-end reservation → payment → confirmation flow |
| `test-search.ps1` | Movie search and filtering |
| `verify-auth.ps1` | Registration, login, JWT, and role-based access |

```powershell
# Example: run the concurrency test
.\test-concurrency.ps1
```

> **Note**: Ensure the server is running and the database is seeded before running tests.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**Built with ❤️ by [Ravi Kesharwani](https://github.com/Ravi-667)**