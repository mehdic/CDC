# Developer Onboarding Guide

Welcome to MetaPharm Connect! This guide will help you get up and running with the codebase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Development Environment](#development-environment)
4. [Project Structure](#project-structure)
5. [Architecture Overview](#architecture-overview)
6. [Running the Application](#running-the-application)
7. [Running Tests](#running-tests)
8. [Coding Conventions](#coding-conventions)
9. [Common Workflows](#common-workflows)
10. [Getting Help](#getting-help)

## Prerequisites

Before you start, ensure you have:

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **npm** or **yarn** (v9+)
- **Git** (v2.25+) - [Download](https://git-scm.com/)
- **Docker** (optional, for running services locally)
- **PostgreSQL** (v14+) - for development database
- A code editor (VS Code recommended)

### System Requirements

- **OS**: macOS, Linux, or Windows (with WSL2)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 10GB for node_modules and development files
- **Network**: Stable internet connection for dependencies and services

## Repository Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CDC
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install mobile app dependencies (React Native)
cd mobile
npm install
cd ..

# Install web app dependencies (React)
cd web
npm install
cd ..

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

### 3. Set Up Environment Variables

Copy the example environment files:

```bash
# Backend
cp backend/.env.example backend/.env

# Web
cp web/.env.example web/.env

# Mobile (if needed)
cp mobile/.env.example mobile/.env
```

Edit the `.env` files with your local configuration. Key variables:

**Backend (.env)**:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/metapharm_dev
JWT_SECRET=your-dev-secret-key-here
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

**Web (.env)**:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

### 4. Initialize the Database

```bash
cd backend

# Run migrations
npm run migrate

# Seed development data (optional)
npm run seed
```

## Development Environment

### VS Code Setup (Recommended)

1. **Install Extensions**:
   - ESLint
   - Prettier - Code formatter
   - Jest Runner
   - Thunder Client (for API testing)
   - SQLTools (for database browsing)

2. **Create `.vscode/settings.json`**:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "typescript"],
  "jest.showCoverageOnLoad": false
}
```

3. **Create `.vscode/launch.json` for debugging**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/dist/index.js",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

## Project Structure

```
CDC/
├── backend/                    # Node.js/Express backend API
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Data models
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Entry point
│   ├── tests/                 # Test files
│   ├── migrations/            # Database migrations
│   ├── package.json
│   └── tsconfig.json
│
├── web/                       # React web application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # State management
│   │   ├── utils/             # Utilities
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Root component
│   └── public/
│
├── mobile/                    # React Native mobile apps
│   ├── src/
│   │   ├── screens/           # Mobile screens
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API and device services
│   │   ├── navigation/        # Navigation setup
│   │   └── store/             # State management
│   └── app.json
│
├── dashboard/                 # Admin dashboard
│   ├── src/
│   │   └── components/
│   └── public/
│
├── docs/                      # Documentation
├── infrastructure/            # Docker, Kubernetes configs
├── specs/                     # Feature specifications
└── README.md
```

## Architecture Overview

### Technology Stack

**Backend**:
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: JWT with role-based access control (RBAC)
- **API**: RESTful with OpenAPI/Swagger documentation

**Frontend**:
- **Web**: React 18+ with TypeScript
- **Mobile**: React Native
- **State Management**: Redux or Zustand
- **Styling**: CSS-in-JS or Tailwind CSS

**DevOps**:
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions

### Architecture Layers

```
┌─────────────────────────────────────────┐
│   Web (React)    Mobile (RN)  Dashboard │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────┐
│         API Gateway / Load Balancer     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Controllers (Route Handlers)            │
├──────────────────────────────────────────┤
│  Services (Business Logic)               │
├──────────────────────────────────────────┤
│  Middleware (Auth, Validation, Logging) │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼──┐ ┌────▼──┐  ┌────▼──┐
   │  PostgreSQL  Redis  External
   │  Database    Cache   APIs
   └─────────────────────────────┘
```

## Running the Application

### Development Mode

**Start Backend**:
```bash
cd backend
npm run dev
```

This starts the backend API on `http://localhost:5000`

**Start Web App** (in another terminal):
```bash
cd web
npm start
```

This opens the web app on `http://localhost:3000`

**Start Mobile App** (in another terminal):
```bash
cd mobile

# iOS
npm run ios

# Android
npm run android
```

**Start Dashboard** (in another terminal):
```bash
cd dashboard
npm start
```

### Docker Composition

To run all services with Docker:

```bash
docker-compose up -d
```

Check `docker-compose.yml` for all available services.

## Running Tests

### Unit Tests

```bash
# All tests
npm test

# Specific package
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Integration Tests

```bash
cd backend
npm run test:integration
```

### E2E Tests (Web)

```bash
cd web
npm run test:e2e
```

### E2E Tests (Mobile)

```bash
cd mobile
npm run test:e2e
```

## Coding Conventions

### TypeScript

- Use strict mode: `"strict": true` in `tsconfig.json`
- Prefer explicit types over inference
- Use interfaces for contracts, types for unions
- Name files in camelCase (components in PascalCase)

**Example**:
```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'pharmacist';
}

async function getUser(id: string): Promise<User> {
  // implementation
}

// Avoid
function getUser(id) {
  // missing types
}
```

### Naming Conventions

- **Files**: `camelCase.ts`, `PascalCase.tsx` for components
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

**Example**:
```typescript
// Files
getUserById.ts
UserCard.tsx
emailService.ts

// Code
const MAX_RETRIES = 3;
const userData = fetchUser();
function sendEmail(to: string): void { }
class UserService { }
interface IUserResponse { }
```

### Code Style

- Use Prettier for formatting
- Use ESLint for linting
- Maximum line length: 100 characters
- Use async/await over promises
- Use const by default, let if needed (avoid var)

**Example**:
```typescript
// Good
async function processData() {
  const data = await fetchData();
  const result = transform(data);
  return result;
}

// Avoid
function processData() {
  return fetchData().then(data => {
    return transform(data);
  });
}
```

### Error Handling

- Use typed errors
- Always handle promise rejections
- Provide meaningful error messages

**Example**:
```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function validateEmail(email: string): Promise<void> {
  if (!email.includes('@')) {
    throw new ValidationError('Invalid email format');
  }
}
```

## Common Workflows

### Creating a New Feature

1. **Create a feature branch**:
```bash
git checkout -b feature/user-authentication
```

2. **Create feature structure**:
```bash
# In backend/src/modules
mkdir -p auth
touch auth/auth.controller.ts
touch auth/auth.service.ts
touch auth/auth.types.ts
touch auth/auth.routes.ts
```

3. **Write tests first** (TDD):
```bash
touch auth/__tests__/auth.service.test.ts
```

4. **Implement feature**:
- Write tests
- Implement code
- Update types
- Add routes

5. **Commit and push**:
```bash
git add .
git commit -m "feat: add user authentication"
git push origin feature/user-authentication
```

### Running Linter & Formatter

```bash
# Format code
npm run format

# Check linting issues
npm run lint

# Fix linting issues
npm run lint --fix
```

### Database Changes

1. **Create migration**:
```bash
cd backend
npm run migration:create AddUserTable
```

2. **Edit migration file** in `migrations/`

3. **Run migration**:
```bash
npm run migration:up
```

4. **Update types**:
```bash
# Update src/types/models.ts
```

## Getting Help

### Documentation
- [Architecture Documentation](../architecture/README.md)
- [API Documentation](../api/README.md)
- [Troubleshooting Guide](../troubleshooting/README.md)

### Community & Support
- Check existing GitHub Issues
- Review pull request comments
- Ask in team Slack channel
- Schedule a pairing session with senior developers

### Quick Debugging Tips

1. **Check logs**:
```bash
# Backend logs
docker logs metapharm-backend

# Check log files
tail -f backend/logs/debug.log
```

2. **Debug with VS Code**:
- Set breakpoints with F9
- Press F5 to start debugging
- Use Watch expressions

3. **Database inspection**:
```bash
# Connect with psql
psql postgresql://user:password@localhost:5432/metapharm_dev

# List tables
\dt

# View schema
\d table_name
```

4. **API Testing**:
- Use Thunder Client in VS Code
- Or use Postman
- Import collection from `docs/api/postman-collection.json`

---

**Happy coding! Welcome to the MetaPharm Connect team! 🚀**

For more information, see the [Architecture Documentation](../architecture/README.md).
