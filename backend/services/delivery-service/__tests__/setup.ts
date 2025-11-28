/**
 * Jest Test Setup
 * Global configuration for tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests

// Increase test timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});
