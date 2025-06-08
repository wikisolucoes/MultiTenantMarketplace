# WikiStore - SaaS Multi-tenant E-commerce Platform

## Architecture Overview

This project is now structured as separate backend and frontend applications, ready for independent deployment:

```
├── server/       # NestJS Backend API (Port 3001)
├── client/       # React Frontend (Port 3000)
```

## Quick Start

### Development (Both services)
```bash
npm run dev
```

### Backend Only (API)
```bash
cd api
npm install
npm run start:dev
```
API will be available at: http://localhost:3001
API Documentation: http://localhost:3001/api/docs

### Frontend Only (Client)
```bash
cd client
npm install
npm run dev
```
Frontend will be available at: http://localhost:3000

## Deployment Architecture

### AWS Deployment Strategy

**Backend (API)** → **AWS App Runner**
- Auto-scaling Node.js service
- Environment: `api/` directory
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Port: 3001

**Frontend (Client)** → **AWS Amplify**
- Static React build with CDN
- Environment: `client/` directory  
- Build command: `npm run build`
- Output directory: `dist/`

## Environment Variables

### Backend (api/.env)
```
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

### Frontend (client/.env)
```
VITE_API_URL=https://your-api-domain.com
```

## Features

- Multi-tenant SaaS architecture
- Brazilian market integrations (Celcoin, PIX, Boleto)
- Admin dashboard and merchant management
- Product and order management
- Identity verification system
- Plugin marketplace for payment gateways
- Discount coupon system
- Real-time notifications

## Technology Stack

**Backend:**
- NestJS with TypeScript
- PostgreSQL with Prisma ORM
- JWT Authentication
- Swagger API Documentation
- Rate limiting and security

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui components
- Wouter for routing