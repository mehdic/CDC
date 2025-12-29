# Database Seeding Scripts

This directory contains scripts to populate the PostgreSQL database with test data for development and testing.

## Available Scripts

### 1. `dev-seed.ts` (Basic Seed)
Seeds basic data: pharmacies and users only.

**Usage:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm npm run seed:dev
```

**Data Created:**
- 3 pharmacies (Lausanne, Geneva, Sion)
- 8 users (pharmacists, doctors, nurses, delivery, patients)

### 2. `comprehensive-seed.ts` (Full Seed) ⭐ **NEW**
Seeds comprehensive data for the pharmacist application including all related entities.

**Usage:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm ts-node backend/shared/db/seeds/comprehensive-seed.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "seed:comprehensive": "ts-node shared/db/seeds/comprehensive-seed.ts"
  }
}
```

**Data Created:**
- ✅ **3 pharmacies** (Swiss locations with realistic data)
- ✅ **12 users** (3 pharmacists, 2 doctors, 1 nurse, 1 delivery, 5 patients)
- ✅ **6 categories** (hierarchical product categories)
- ✅ **10 products** (OTC medications, vitamins, parapharmacy)
- ✅ **5 prescriptions** (various statuses: pending, approved, in_review, clarification_needed)
- ✅ **6 prescription items** (with AI confidence scores)
- ✅ **7 inventory items** (stock management across pharmacies)
- ✅ **3 inventory alerts** (low stock, expiring soon, critical stock)

## Features

### Swiss/French Localization
All data uses Swiss/French naming conventions:
- Pharmacies: "Pharmacie du Lac", "Pharmacie Centrale Genève"
- Products: "Paracétamol", "Ibuprofène", "Vitamine C"
- Cities: Lausanne, Genève, Sion
- Cantons: VD, GE, VS

### Realistic Test Scenarios

#### Prescription Processing
- **Approved prescription**: High AI confidence (95.5%), doctor_direct source
- **Pending prescription**: Low AI confidence (72.3%), patient_upload with image
- **In review prescription**: Medium AI confidence (88.7%), teleconsultation
- **Clarification needed**: Very low AI confidence (65.2%), illegible dosage

#### Inventory Management
- **Normal stock**: Amoxicilline (250 units)
- **Low stock warning**: Paracétamol (45 units, threshold 50)
- **Critical stock alert**: Métformine (8 units, threshold 20)
- **Controlled substance**: Morphine (schedule II)
- **Refrigerated item**: Insuline Humalog
- **Expiring soon**: Insuline (expires April 2025)

#### Product Catalog
- Products with ratings and reviews
- Featured products
- Discounted products (original_price vs price)
- Hierarchical categories (parent/child)

## Test Credentials

### Pharmacists
```
Email: pharmacist@test.metapharm.ch
Password: TestPass123!
Pharmacy: Pharmacie du Lac (Lausanne)

Email: pharmacist2@test.com
Password: Test123!
Pharmacy: Pharmacie Centrale Genève

Email: pharmacist3@test.com
Password: Test123!
Pharmacy: Pharmacie des Alpes (Sion)
```

### Doctors
```
Email: doctor@test.metapharm.ch
Password: TestPass123!

Email: doctor2@test.com
Password: Test123!
```

### Patients
```
Email: patient@test.metapharm.ch
Password: TestPass123!

Email: patient1@test.com
Password: Test123!

Email: patient2@test.com
Password: Test123!
```

## Database Requirements

### Required Tables
The seed script expects the following tables to exist:
- `pharmacies`
- `users`
- `categories`
- `products`
- `prescriptions`
- `prescription_items`
- `inventory_items`
- `inventory_alerts`

### Running Migrations First
Ensure all database migrations are run before seeding:
```bash
npm run migrate:up
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://postgres:postgres@localhost:5432/metapharm`

Optional:
- `NODE_ENV`: Set to `production` to enable SSL

## Data Encryption

### Development Mode (Mock Encryption)
The seed scripts use mock encryption for PII fields:
- `first_name_encrypted`
- `last_name_encrypted`
- `phone_encrypted`
- `address_encrypted`

Mock encryption: `Buffer.from(\`ENC:${value}\`, 'utf-8')`

### Production Mode
In production, replace `mockEncrypt()` with actual AWS KMS encryption.

## Password Hashing

All user passwords are hashed using bcrypt with 10 salt rounds:
```typescript
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);
```

## Transaction Safety

All seeding operations are wrapped in a database transaction:
```typescript
await client.query('BEGIN');
// ... seed operations
await client.query('COMMIT');
```

If any error occurs, all changes are rolled back:
```typescript
catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

## Testing

Run unit tests for the seed script:
```bash
npm test -- comprehensive-seed.test.ts
```

Tests verify:
- All tables have data
- Foreign key relationships are maintained
- Swiss/French naming conventions
- Encrypted fields are properly stored
- AI confidence scores are valid
- Product pricing is correct

## Troubleshooting

### Connection Issues
```
Error: DATABASE_URL environment variable is required
```
**Solution**: Set the DATABASE_URL environment variable

### Table Not Found
```
Error: relation "pharmacies" does not exist
```
**Solution**: Run migrations first: `npm run migrate:up`

### Duplicate Key Violation
```
Error: duplicate key value violates unique constraint
```
**Solution**: Clear existing data or use a fresh database

### Permission Denied
```
Error: permission denied for table pharmacies
```
**Solution**: Ensure database user has INSERT permissions

## Development Workflow

1. **Create fresh database**:
   ```bash
   createdb metapharm_dev
   ```

2. **Run migrations**:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm_dev npm run migrate:up
   ```

3. **Seed database**:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm_dev ts-node backend/shared/db/seeds/comprehensive-seed.ts
   ```

4. **Verify data**:
   ```bash
   psql metapharm_dev -c "SELECT COUNT(*) FROM pharmacies;"
   psql metapharm_dev -c "SELECT COUNT(*) FROM users;"
   psql metapharm_dev -c "SELECT COUNT(*) FROM prescriptions;"
   ```

## Resetting Database

To start fresh:
```bash
# Drop all data
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm npm run migrate:down

# Re-run migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm npm run migrate:up

# Re-seed
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metapharm ts-node backend/shared/db/seeds/comprehensive-seed.ts
```

## Contributing

When adding new seed data:
1. Maintain Swiss/French naming conventions
2. Use realistic data (Swiss addresses, phone numbers)
3. Maintain foreign key relationships
4. Add corresponding test cases
5. Update this README

## License

Internal use only - MetaPharm Connect Backend
