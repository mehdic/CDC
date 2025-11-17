const bcrypt = require('bcrypt');

const password = 'password';
const saltRounds = 10;

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated hash:', hash);

    // Test it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
