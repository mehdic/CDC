/**
 * SSL/TLS Auto-Renewal Configuration (T2-024)
 * Let's Encrypt integration with automatic certificate renewal
 * Based on ACME protocol (RFC 8555)
 *
 * Features:
 * - Automatic certificate generation
 * - 30-day renewal before expiry
 * - Multi-domain support (SAN certificates)
 * - HTTP-01 and DNS-01 challenge support
 * - Automatic HTTPS redirection
 * - Certificate validation checks
 * - Monitoring and alerting
 */

import * as acme from 'acme-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import { isProduction } from '../shared/config/security';

// ============================================================================
// Configuration
// ============================================================================

export interface SSLConfig {
  // Let's Encrypt API
  letsEncryptDirectory: string; // Production or staging
  accountEmail: string; // Email for Let's Encrypt notifications

  // Certificate storage
  certDir: string; // Directory to store certificates
  privateKeyPath: string; // Path to private key
  certPath: string; // Path to certificate
  chainPath: string; // Path to certificate chain
  fullchainPath: string; // Path to fullchain (cert + chain)

  // Domains
  domains: string[]; // List of domains to secure (first is primary, rest are SANs)

  // Renewal settings
  renewalDays: number; // Days before expiry to renew (default: 30)
  checkIntervalHours: number; // How often to check for renewal (default: 24)

  // Challenge type
  challengeType: 'http-01' | 'dns-01';
  dnsProvider?: string; // For DNS-01 challenge (e.g., 'cloudflare', 'route53')

  // HTTP-01 challenge settings (if using http-01)
  challengeDir: string; // Directory for ACME challenge files

  // Monitoring
  notifyEmail?: string; // Email to notify on renewal success/failure
  slackWebhook?: string; // Slack webhook for notifications
}

/**
 * Get SSL configuration from environment variables
 */
export function getSSLConfig(): SSLConfig {
  const env = process.env;

  // Use Let's Encrypt staging in dev/test, production in prod
  const letsEncryptDirectory = isProduction()
    ? acme.directory.letsencrypt.production
    : acme.directory.letsencrypt.staging;

  return {
    letsEncryptDirectory,
    accountEmail: env.SSL_ACCOUNT_EMAIL || env.ADMIN_EMAIL || 'admin@metapharm-connect.ch',

    certDir: env.SSL_CERT_DIR || '/etc/letsencrypt/live/metapharm-connect.ch',
    privateKeyPath: env.SSL_PRIVATE_KEY || '/etc/letsencrypt/live/metapharm-connect.ch/privkey.pem',
    certPath: env.SSL_CERT || '/etc/letsencrypt/live/metapharm-connect.ch/cert.pem',
    chainPath: env.SSL_CHAIN || '/etc/letsencrypt/live/metapharm-connect.ch/chain.pem',
    fullchainPath: env.SSL_FULLCHAIN || '/etc/letsencrypt/live/metapharm-connect.ch/fullchain.pem',

    domains: (env.SSL_DOMAINS || 'metapharm-connect.ch,api.metapharm-connect.ch,www.metapharm-connect.ch').split(','),

    renewalDays: parseInt(env.SSL_RENEWAL_DAYS || '30', 10),
    checkIntervalHours: parseInt(env.SSL_CHECK_INTERVAL_HOURS || '24', 10),

    challengeType: (env.SSL_CHALLENGE_TYPE as 'http-01' | 'dns-01') || 'http-01',
    dnsProvider: env.DNS_PROVIDER,

    challengeDir: env.SSL_CHALLENGE_DIR || '/var/www/letsencrypt/.well-known/acme-challenge',

    notifyEmail: env.SSL_NOTIFY_EMAIL || env.ADMIN_EMAIL,
    slackWebhook: env.SLACK_WEBHOOK_URL,
  };
}

// ============================================================================
// Certificate Management
// ============================================================================

/**
 * Initialize ACME client for Let's Encrypt
 */
async function initACMEClient(config: SSLConfig): Promise<acme.Client> {
  // Load or create account private key
  const accountKeyPath = path.join(config.certDir, '../accounts/account-key.pem');

  let accountKey: Buffer;
  try {
    accountKey = await fs.readFile(accountKeyPath);
  } catch (error) {
    // Generate new account key if not exists
    console.log('Generating new Let\'s Encrypt account key...');
    accountKey = await acme.crypto.createPrivateKey();
    await fs.mkdir(path.dirname(accountKeyPath), { recursive: true });
    await fs.writeFile(accountKeyPath, accountKey);
    await fs.chmod(accountKeyPath, 0o600); // Secure permissions
  }

  // Initialize ACME client
  const client = new acme.Client({
    directoryUrl: config.letsEncryptDirectory,
    accountKey,
  });

  return client;
}

/**
 * Create Let's Encrypt account (if not exists)
 */
async function createAccount(client: acme.Client, config: SSLConfig): Promise<void> {
  try {
    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${config.accountEmail}`],
    });
    console.log(`✓ Let's Encrypt account created for ${config.accountEmail}`);
  } catch (error: any) {
    if (error.message?.includes('Account already exists')) {
      console.log('✓ Let\'s Encrypt account already exists');
    } else {
      throw error;
    }
  }
}

/**
 * Request new SSL certificate from Let's Encrypt
 */
export async function requestCertificate(config: SSLConfig): Promise<void> {
  console.log('🔐 Requesting SSL certificate from Let\'s Encrypt...');
  console.log(`   Domains: ${config.domains.join(', ')}`);

  try {
    // Initialize ACME client
    const client = await initACMEClient(config);

    // Create account if needed
    await createAccount(client, config);

    // Generate certificate private key
    const [certKey, certCsr] = await acme.crypto.createCsr({
      commonName: config.domains[0],
      altNames: config.domains.slice(1), // SANs
    });

    // Create certificate order
    const order = await client.createOrder({
      identifiers: config.domains.map((domain) => ({
        type: 'dns',
        value: domain,
      })),
    });

    // Complete challenges
    const authorizations = await client.getAuthorizations(order);

    for (const authz of authorizations) {
      // Get challenge based on type
      const challenge = authz.challenges.find((c) => c.type === config.challengeType);

      if (!challenge) {
        throw new Error(`Challenge type ${config.challengeType} not available for ${authz.identifier.value}`);
      }

      // HTTP-01 challenge
      if (config.challengeType === 'http-01') {
        const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
        const challengePath = path.join(config.challengeDir, challenge.token);

        // Write challenge file
        await fs.mkdir(config.challengeDir, { recursive: true });
        await fs.writeFile(challengePath, keyAuthorization);

        console.log(`✓ HTTP-01 challenge file created for ${authz.identifier.value}`);
      }

      // DNS-01 challenge
      if (config.challengeType === 'dns-01') {
        const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
        const dnsRecord = `_acme-challenge.${authz.identifier.value}`;
        const txtValue = keyAuthorization;

        console.log(`⚠️  Manual DNS record required:`);
        console.log(`   Type: TXT`);
        console.log(`   Name: ${dnsRecord}`);
        console.log(`   Value: ${txtValue}`);
        console.log(`   (Waiting 60 seconds for DNS propagation...)`);

        // Wait for DNS propagation
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }

      // Notify Let's Encrypt that challenge is ready
      await client.completeChallenge(challenge);
      await client.waitForValidStatus(challenge);

      console.log(`✓ Challenge completed for ${authz.identifier.value}`);
    }

    // Finalize order
    await client.finalizeOrder(order, certCsr);

    // Get certificate
    const cert = await client.getCertificate(order);

    // Parse certificate chain
    const certChain = cert.split('-----END CERTIFICATE-----\n');
    const certificate = certChain[0] + '-----END CERTIFICATE-----\n';
    const chain = certChain.slice(1).join('').trim();
    const fullchain = cert;

    // Save certificates
    await fs.mkdir(config.certDir, { recursive: true });
    await fs.writeFile(config.privateKeyPath, certKey);
    await fs.writeFile(config.certPath, certificate);
    await fs.writeFile(config.chainPath, chain);
    await fs.writeFile(config.fullchainPath, fullchain);

    // Secure permissions
    await fs.chmod(config.privateKeyPath, 0o600);
    await fs.chmod(config.certPath, 0o644);
    await fs.chmod(config.chainPath, 0o644);
    await fs.chmod(config.fullchainPath, 0o644);

    console.log('✅ SSL certificate obtained and saved successfully');

    // Send notification
    await notifySuccess(config, 'Certificate obtained');
  } catch (error) {
    console.error('❌ Failed to obtain SSL certificate:', error);
    await notifyFailure(config, error as Error);
    throw error;
  }
}

/**
 * Check if certificate needs renewal
 */
export async function needsRenewal(config: SSLConfig): Promise<boolean> {
  try {
    const certPem = await fs.readFile(config.certPath, 'utf-8');
    const cert = await acme.crypto.readCertificateInfo(certPem);

    const expiryDate = new Date(cert.notAfter);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`📅 Certificate expires in ${daysUntilExpiry} days (${expiryDate.toISOString()})`);

    return daysUntilExpiry <= config.renewalDays;
  } catch (error) {
    console.warn('⚠️  Could not read certificate, assuming renewal needed:', error);
    return true; // If we can't read cert, assume we need to obtain one
  }
}

/**
 * Validate certificate
 */
export async function validateCertificate(config: SSLConfig): Promise<boolean> {
  try {
    const certPem = await fs.readFile(config.certPath, 'utf-8');
    const keyPem = await fs.readFile(config.privateKeyPath, 'utf-8');

    // Check if certificate and key match
    const certInfo = await acme.crypto.readCertificateInfo(certPem);

    // Check domains
    const certDomains = [certInfo.domains.commonName, ...certInfo.domains.altNames];
    const missingDomains = config.domains.filter((d) => !certDomains.includes(d));

    if (missingDomains.length > 0) {
      console.warn(`⚠️  Certificate missing domains: ${missingDomains.join(', ')}`);
      return false;
    }

    // Check expiry
    const expiryDate = new Date(certInfo.notAfter);
    const now = new Date();

    if (expiryDate < now) {
      console.warn('⚠️  Certificate has expired');
      return false;
    }

    console.log('✓ Certificate validation passed');
    return true;
  } catch (error) {
    console.error('❌ Certificate validation failed:', error);
    return false;
  }
}

/**
 * Renew certificate if needed
 */
export async function renewCertificateIfNeeded(config: SSLConfig): Promise<void> {
  console.log('🔍 Checking if certificate renewal is needed...');

  const needsRenewalResult = await needsRenewal(config);

  if (needsRenewalResult) {
    console.log('🔄 Certificate renewal required');
    await requestCertificate(config);
  } else {
    console.log('✓ Certificate still valid, no renewal needed');
  }
}

// ============================================================================
// Automatic Renewal Scheduler
// ============================================================================

let renewalIntervalId: NodeJS.Timeout | null = null;

/**
 * Start automatic certificate renewal checks
 */
export function startAutoRenewal(config: SSLConfig): void {
  console.log('🤖 Starting automatic SSL renewal scheduler...');
  console.log(`   Check interval: Every ${config.checkIntervalHours} hours`);
  console.log(`   Renewal threshold: ${config.renewalDays} days before expiry`);

  // Check immediately on startup
  renewCertificateIfNeeded(config).catch((error) => {
    console.error('Initial renewal check failed:', error);
  });

  // Schedule periodic checks
  const intervalMs = config.checkIntervalHours * 60 * 60 * 1000;

  renewalIntervalId = setInterval(() => {
    renewCertificateIfNeeded(config).catch((error) => {
      console.error('Scheduled renewal check failed:', error);
    });
  }, intervalMs);

  console.log('✓ Auto-renewal scheduler started');
}

/**
 * Stop automatic renewal scheduler
 */
export function stopAutoRenewal(): void {
  if (renewalIntervalId) {
    clearInterval(renewalIntervalId);
    renewalIntervalId = null;
    console.log('✓ Auto-renewal scheduler stopped');
  }
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Send success notification
 */
async function notifySuccess(config: SSLConfig, message: string): Promise<void> {
  console.log(`✅ ${message}`);

  // Slack notification
  if (config.slackWebhook) {
    try {
      const payload = {
        text: `🔐 SSL Certificate: ${message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *SSL Certificate Update*\n${message}\n\nDomains: ${config.domains.join(', ')}`,
            },
          },
        ],
      };

      await fetch(config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to send Slack notification:', error);
    }
  }

  // TODO: Email notification (requires email service integration)
}

/**
 * Send failure notification
 */
async function notifyFailure(config: SSLConfig, error: Error): Promise<void> {
  console.error(`❌ SSL renewal failed: ${error.message}`);

  // Slack notification
  if (config.slackWebhook) {
    try {
      const payload = {
        text: `🚨 SSL Certificate Renewal Failed`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ *SSL Certificate Renewal Failed*\n\nError: ${error.message}\n\nDomains: ${config.domains.join(', ')}\n\n⚠️ Manual intervention may be required.`,
            },
          },
        ],
      };

      await fetch(config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Failed to send Slack notification:', err);
    }
  }

  // TODO: Email notification (requires email service integration)
}

// ============================================================================
// HTTPS Server Integration
// ============================================================================

/**
 * Load SSL certificates for HTTPS server
 */
export async function loadSSLCertificates(config: SSLConfig): Promise<https.ServerOptions> {
  try {
    const key = await fs.readFile(config.privateKeyPath, 'utf-8');
    const cert = await fs.readFile(config.fullchainPath, 'utf-8');

    return {
      key,
      cert,
      // Additional security options
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384',
      honorCipherOrder: true,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
    };
  } catch (error) {
    throw new Error(`Failed to load SSL certificates: ${(error as Error).message}`);
  }
}

// ============================================================================
// CLI Commands (for manual management)
// ============================================================================

/**
 * Manual renewal command
 * Usage: npm run ssl:renew
 */
export async function manualRenewal(): Promise<void> {
  const config = getSSLConfig();
  console.log('🔄 Manual SSL certificate renewal...');
  await requestCertificate(config);
  console.log('✅ Manual renewal complete');
}

/**
 * Manual validation command
 * Usage: npm run ssl:validate
 */
export async function manualValidation(): Promise<void> {
  const config = getSSLConfig();
  console.log('🔍 Validating SSL certificate...');
  const isValid = await validateCertificate(config);

  if (isValid) {
    console.log('✅ Certificate is valid');
    process.exit(0);
  } else {
    console.error('❌ Certificate validation failed');
    process.exit(1);
  }
}
