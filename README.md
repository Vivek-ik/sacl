# SACL 2.0 — MERN Cricket Auction Platform

A full-stack starter application for cricket tournament registration, team/player approvals, and real-time player auctions.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Real-time: Socket.IO
- Auth: JWT + role-based middleware
- Uploads: Cloudinary

## Roles
- `player`: register and view application/auction status
- `team_owner`: register a team and participate in its auction
- `auctioneer`: operate the live auction
- `admin`: approve registrations and manage the tournament

## Auction defaults
- Team purse: 50,000 points
- Squad size: 13
- Timer: 45 seconds
- Categories: Iconic 15,000; A 10,000; B 7,000; C 5,000; D 3,000
- Iconic player limit: 1 per team
- Minimum reserve: 500 points per unfilled squad slot

These values are centralized in `server/src/config/auctionRules.js`.

## Run locally

### 1. Requirements
Node.js 20+, npm, and MongoDB (local or Atlas).

### 2. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`; API runs at `http://localhost:5000`.

## Create the first admin
Register a user through the API with role `player`, then promote the user directly in MongoDB:
```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```
Public registration deliberately does not allow users to self-assign privileged roles.

## Important production work
This is an executable MVP starter, not a production-ready deployment. Before a live tournament:
- Add rate limiting, request validation, security headers, audit logs, password reset, email/phone verification and refresh-token/session management.
- Use HTTPS and strong secrets; restrict CORS to the deployed frontend.
- Configure MongoDB backups and Cloudinary upload restrictions.
- Add payment-provider integration only after merchant onboarding and legal review.
- Run concurrency/load tests with all team devices.
- Use a trusted server clock. Auction state changes are server-authoritative; clients must never decide the winning bid or purse balance.
- Consider Redis Socket.IO adapter if deploying multiple backend instances.
