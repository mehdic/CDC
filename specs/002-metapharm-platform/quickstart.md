# Quick Start Guide: MetaPharm Connect Local Development

**Purpose**: Get MetaPharm Connect running locally for development
**Audience**: Backend, mobile, and web developers
**Prerequisites**: Docker Desktop, Node.js 20 LTS, Git

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Backend Services](#backend-services)
3. [Mobile Apps](#mobile-apps)
4. [Web Application](#web-application)
5. [Database & Migrations](#database--migrations)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/metapharm/metapharm-connect.git
cd metapharm-connect
```

### 2. Install Dependencies

```bash
# Install backend dependencies (from repo root)
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Install web dependencies
cd ../web
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` in each directory and configure:

**Backend `.env`:**
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm_dev
REDIS_URL=redis://localhost:6379

# AWS Services
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_KMS_KEY_ID=arn:aws:kms:eu-central-1:account:key/xxx  # Encryption key

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VIDEO_API_KEY=SKxxxxxxxxx
TWILIO_VIDEO_API_SECRET=your_secret

# External APIs
HIN_CLIENT_ID=your_hin_client_id
HIN_CLIENT_SECRET=your_hin_secret
HIN_REDIRECT_URI=http://localhost:3000/auth/hin/callback

FDB_API_KEY=your_first_databank_api_key  # Drug interaction database

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1h
```

**Mobile `.env`:**
```env
API_BASE_URL=http://localhost:4000/v1
TWILIO_VIDEO_URL=wss://video.twilio.com
```

**Web `.env`:**
```env
REACT_APP_API_BASE_URL=http://localhost:4000/v1
REACT_APP_TWILIO_VIDEO_URL=wss://video.twilio.com
```

---

## Backend Services

### Using Docker Compose (Recommended)

Start all backend services with one command:

```bash
cd infrastructure/docker
docker-compose up -d
```

This starts:
- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379)
- API Gateway (port 4000)
- Auth Service (port 4001)
- Prescription Service (port 4002)
- Teleconsultation Service (port 4003)
- Inventory Service (port 4004)
- Notification Service (port 4005)

**View logs:**
```bash
docker-compose logs -f [service-name]
```

**Stop services:**
```bash
docker-compose down
```

### Running Services Individually (Development)

For active development on a specific service:

```bash
cd backend/services/prescription-service
npm run dev  # Starts with nodemon for hot-reload
```

**Available Services:**
- `api-gateway`: Port 4000 (entry point for all API requests)
- `auth-service`: Port 4001 (authentication, HIN e-ID, JWT)
- `prescription-service`: Port 4002 (prescription processing, OCR)
- `teleconsultation-service`: Port 4003 (video calls, Twilio integration)
- `inventory-service`: Port 4004 (QR scanning, stock management)
- `notification-service`: Port 4005 (push notifications, email/SMS)

---

## Mobile Apps

### iOS (Requires macOS + Xcode)

```bash
cd mobile/patient-app  # or pharmacist-app, doctor-app, etc.

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on iOS Simulator
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

### Android

```bash
cd mobile/patient-app

# Ensure Android SDK is installed and ANDROID_HOME is set
# Start Android Emulator manually or:
npm run android

# Run on specific device
adb devices  # List connected devices
npm run android -- --deviceId=emulator-5554
```

### Available Mobile Apps

- `patient-app`: Patient interface (prescriptions, orders, teleconsultation)
- `pharmacist-app`: Pharmacist interface (prescription validation, inventory)
- `doctor-app`: Doctor interface (HIN e-ID login, prescription creation)
- `nurse-app`: Nurse interface (medication ordering for patients)
- `delivery-app`: Delivery personnel (route optimization, GPS tracking)

### Hot Reload

React Native Metro bundler enables hot reload by default. Edit files in `src/` and see changes instantly.

---

## Web Application

### Development Server

```bash
cd web
npm run dev  # Starts on http://localhost:3001
```

### Build for Production

```bash
npm run build  # Outputs to web/build/
```

### Role-Specific Access

Navigate to:
- **Pharmacist**: http://localhost:3001/pharmacist
- **Doctor**: http://localhost:3001/doctor
- **Nurse**: http://localhost:3001/nurse
- **Delivery**: http://localhost:3001/delivery
- **Patient**: http://localhost:3001/patient

Login with test credentials (see [Database & Migrations](#database--migrations) for seed data).

---

## Database & Migrations

### Run Migrations

```bash
cd backend/shared/db
npm run migrate:latest  # Apply all pending migrations
```

### Seed Test Data

```bash
npm run seed:dev  # Populates database with test users, prescriptions, inventory
```

**Test Users Created:**
```
Pharmacist: pharmacist@test.ch / Password123!
Doctor: doctor@test.ch / Password123!
Nurse: nurse@test.ch / Password123!
Delivery: delivery@test.ch / Password123!
Patient: patient@test.ch / Password123!
```

### Create New Migration

```bash
npm run migrate:make create_new_table  # Creates migration file in migrations/
```

### Rollback Migration

```bash
npm run migrate:rollback  # Undo last migration batch
```

### Database Schema Viewer

View current schema:
```bash
psql postgresql://postgres:postgres@localhost:5432/metapharm_dev
\dt  # List tables
\d prescriptions  # Describe prescriptions table
```

---

## Testing

### Backend Unit Tests

```bash
cd backend/services/prescription-service
npm test  # Runs Jest tests
npm run test:watch  # Watch mode for development
npm run test:coverage  # Generate coverage report
```

### Backend Integration Tests

```bash
cd backend
npm run test:integration  # Tests across services
```

### Mobile Tests

```bash
cd mobile/patient-app
npm test  # Jest + React Native Testing Library
npm run test:e2e:ios  # Detox E2E tests (requires build first)
npm run test:e2e:android
```

### Web Tests

```bash
cd web
npm test  # Jest + React Testing Library
npm run test:e2e  # Playwright E2E tests
```

### API Contract Tests

```bash
cd backend/tests/contract
npm run test:contracts  # Newman (Postman) tests against OpenAPI specs
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Docker Services Won't Start

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose up --build -d
```

### Database Connection Failed

- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check DATABASE_URL in `.env` matches `docker-compose.yml` config
- Test connection: `psql $DATABASE_URL`

### React Native Metro Bundler Issues

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear watchman cache (macOS)
watchman watch-del-all
```

### iOS Build Fails

```bash
cd ios
pod deintegrate  # Remove all pods
pod install  # Reinstall
cd ..
npm run ios
```

### Android Build Fails

```bash
cd android
./gradlew clean  # Clean build artifacts
cd ..
npm run android
```

### Twilio Video Not Working

- Verify `TWILIO_VIDEO_API_KEY` and `TWILIO_VIDEO_API_SECRET` in backend `.env`
- Check Twilio console for API key validity
- Ensure Twilio account has Video API enabled
- Test with Twilio's diagnostic tool: https://www.twilio.com/console/video/diagnostics

### HIN e-ID Integration (Sandbox)

- Register for HIN developer account: https://www.hin.ch/entwickler/
- Configure redirect URI in HIN console to match `HIN_REDIRECT_URI`
- Use sandbox credentials (production requires Swiss healthcare professional registration)

---

## Development Workflow

### Feature Development

1. Create feature branch: `git checkout -b feat/prescription-ai-improvements`
2. Run backend services: `docker-compose up -d`
3. Start service in dev mode: `cd backend/services/prescription-service && npm run dev`
4. Make changes, tests auto-run with `npm run test:watch`
5. Commit changes: `git commit -m "feat: improve prescription OCR accuracy"`
6. Push branch: `git push origin feat/prescription-ai-improvements`
7. Create pull request

### Running Full Stack Locally

1. Start backend: `docker-compose up -d` (from `infrastructure/docker/`)
2. Start web: `npm run dev` (from `web/`)
3. Start mobile: `npm run ios` or `npm run android` (from `mobile/patient-app/`)
4. Access:
   - API: http://localhost:4000
   - Web: http://localhost:3001
   - Mobile: iOS Simulator / Android Emulator

### Debugging

**Backend (VS Code)**:
- Attach debugger to running service (port 9229)
- Set breakpoints in TypeScript files
- Debug config in `.vscode/launch.json`

**Mobile (React Native Debugger)**:
- Install React Native Debugger app
- Enable remote JS debugging in app (Cmd+D iOS, Cmd+M Android)
- Use Redux DevTools for state inspection

**Web (Chrome DevTools)**:
- Open http://localhost:3001
- Open Chrome DevTools (F12)
- Use React DevTools extension for component inspection

---

## Next Steps

1. ✅ **Local Development Setup**: Follow this guide to get services running
2. ⏭ **API Contracts**: Review OpenAPI specs in `specs/002-metapharm-platform/contracts/`
3. ⏭ **Data Model**: Understand entity schemas in `specs/002-metapharm-platform/data-model.md`
4. ⏭ **Implementation Tasks**: Run `/speckit.tasks` to generate actionable tasks for MVP (P1-P3)

---

## Support

- **Documentation**: See `docs/` directory for detailed guides
- **Issues**: Report bugs at https://github.com/metapharm/metapharm-connect/issues
- **Slack**: #metapharm-dev channel for team communication
- **Architecture Decisions**: See `specs/002-metapharm-platform/plan.md`
