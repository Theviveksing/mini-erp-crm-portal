# Mini ERP + CRM Operations Portal

A premium, high-fidelity operations portal built for a wholesale/distribution company, supporting role-based access for sales, warehouse, accounts, and administration teams. 

---

## Technical Stack & Architecture

- **Backend**: Node.js, TypeScript, Express.js.
  - **ORM**: Prisma ORM.
  - **Database**: SQLite (default for instant out-of-the-box local running) / fully compatible with PostgreSQL.
  - **Authentication**: JWT-based stateless authentication with role-based routing middleware.
- **Frontend**: React, TypeScript, Vite.
  - **Styling**: Modern, premium Vanilla CSS with full CSS Variables support, light/dark modes, custom scrollbars, glassmorphism, responsive panels, and smooth micro-animations.
  - **Icons**: Lucide React.
  - **PDF Export**: jsPDF for dynamic invoice generations.
- **Orchestration**: Docker & Docker Compose setup.

---

## Role-Based Access Control

The portal implements strict authorization checks on both the client (UI tabs filtering) and the server (Express middleware). The following users are automatically seeded in the database:

| Role | Username | Password | Access Rights & Modules |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access to all CRM, Inventory, and Sales Challan actions. |
| **Sales** | `sales` | `sales123` | CRM Customer management, log follow-ups, read products, and create/confirm/cancel Sales Challans. |
| **Warehouse** | `warehouse` | `warehouse123` | Read products, create/edit products, post stock adjustments, and view stock ledger movements. |
| **Accounts** | `accounts` | `accounts123` | Read-only access to CRM Customers and Sales Challans, export invoice PDFs. |

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-12345"
```

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Run the Backend Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations and automatically seed the database
npx prisma migrate dev --name init

# Start the development server
npm run dev
```
The server will start running on [http://localhost:5000](http://localhost:5000).

### 2. Run the Frontend App
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the Vite React development server
npm run dev
```
The application will launch on [http://localhost:5173](http://localhost:5173).

---

## Run with Docker Compose

To spin up both services containerized:
```bash
# From the project root directory
docker-compose up --build
```
- **Frontend App**: served on [http://localhost](http://localhost)
- **Backend API**: running on [http://localhost:5000](http://localhost:5000)

---

## Switching Database from SQLite to PostgreSQL

The database is built on Prisma, making it database-agnostic. To switch from the default SQLite configuration to a production PostgreSQL database (e.g. Neon, Supabase, Render):

1. **Update schema**: Open `backend/prisma/schema.prisma` and change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Update Connection String**: Open `backend/.env` and update the connection URL:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<dbname>?schema=public"
   ```
3. **Migrate**: Run Prisma migrations on the new database:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

---

## Core Features & Business Logic Rules

1. **Stateless Auth**: Validates token in auth headers: `Authorization: Bearer <token>`.
2. **Customer CRM**: List view supports pagination, search (by name, company, email, mobile), and status/type dropdown filtering. Follow-ups include a historical note log displaying the issuer's name and timestamps.
3. **Inventory Alert Limits**: Highlights low stock items where `currentStock <= minStockAlert` with a pulsating warning border. Post adjustments write to a separate ledger log tracking the warehouse employee's reason.
4. **Sales Challan Sequential Numbering**: Generates a sequential serial code format: `CH-[YEAR]-[INDEX]` (e.g. `CH-2026-0001`).
5. **Item Snapshotting**: Saves the complete product metadata (name, SKU, cost, location) in a JSON snapshot at the moment of challan compilation. Future price increases or product catalog deletes will not mutate historical financial records.
6. **Stock Reduction Safety checks**:
   - Saving a challan as **Draft** reserves no stock.
   - Confirming a challan executes atomic check transactions. If any item is insufficient, the transaction rolls back, throwing a detailed API error. If successful, stock is deducted and a movement record (type OUT, reason: "Sales Challan X Confirmation") is inserted.
   - Cancelling a Confirmed challan automatically returns the stock to inventory and creates a movement log (type IN, reason: "Sales Challan X Cancellation").

---

## Bonus Points Implemented

1. **Docker Setup**: Multi-stage Nginx serving React code, and Node server.
2. **GitHub Actions**: Integrated CI/CD yaml template under `.github/workflows/deploy.yml`.
3. **Export Invoice as PDF**: Client-side jsPDF script generating professional, high-density print-ready PDF invoices containing logo headings, billing details, tabular items, and signature slips.
