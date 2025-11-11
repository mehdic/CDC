const { exec } = require('child_process');

const query = `SELECT id, email, role, password_hash IS NOT NULL as has_password FROM users WHERE email LIKE '%test%'`;

exec(`psql -h localhost -U postgres -d metapharm_dev -c "${query}"`, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
    console.error('Stderr:', stderr);
    return;
  }
  console.log('Test users in database:');
  console.log(stdout);
});
