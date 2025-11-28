/**
 * Jest test environment setup
 * Sets up necessary environment variables for testing
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// WhatsApp/Twilio configuration (stub values for testing)
process.env.TWILIO_ACCOUNT_SID = 'ACtest123456789';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
process.env.TWILIO_FAX_NUMBER = '+14155238886';

// Email/SMTP configuration (stub values for testing)
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test_password';
process.env.SMTP_FROM_EMAIL = 'noreply@metapharm.ch';
process.env.SMTP_FROM_NAME = 'MetaPharm Connect';

// Messaging service configuration
process.env.MESSAGING_SERVICE_PORT = '4009';
process.env.CORS_ORIGIN = 'http://localhost:3000';
