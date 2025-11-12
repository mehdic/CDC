const bcrypt = require('bcryptjs');

// Generate hash for Test123!
const password = 'Test123!';
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('New hash for Test123!:', hash);

// Verify it works
const isMatch = bcrypt.compareSync(password, hash);
console.log('Verification test:', isMatch);