// Generate bcrypt password hash for test users
// Run: node backend/services/auth-service/node_modules/.bin/ts-node generate-password-hash.js

const bcrypt = require('bcrypt');

const password = 'TestPass123!';

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Bcrypt hash (10 rounds):');
    console.log(hash);

    // Verify it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('\nHash verification:', isValid ? 'VALID' : 'INVALID');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
