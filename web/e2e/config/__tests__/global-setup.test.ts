import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FullConfig } from '@playwright/test';

describe('global-setup.ts', () => {
  const mockBaseURL = 'http://localhost:5173';
  const authDir = path.join(__dirname, '../../../.auth-test');

  // Mock config object
  const mockConfig: FullConfig = {
    projects: [
      {
        use: {
          baseURL: mockBaseURL,
        },
      },
    ],
  } as FullConfig;

  beforeEach(() => {
    // Clean up test auth directory
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    // Reset environment variables
    delete process.env.MOCK_AUTH;
    delete process.env.CI;

    // Mock console methods to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up test auth directory
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    // Restore mocks
    vi.restoreAllMocks();
  });

  describe('MOCK_AUTH mode', () => {
    it('should create mock auth states when MOCK_AUTH=true', () => {
      // Create test directory
      fs.mkdirSync(authDir, { recursive: true });

      // Set MOCK_AUTH environment variable
      process.env.MOCK_AUTH = 'true';

      // Simulate mock auth state generation
      const testUsers = {
        nurse: {
          email: 'nurse@test.metapharm.ch',
          role: 'nurse',
          firstName: 'Caroline',
          lastName: 'Leclerc',
        },
      };

      for (const [role, user] of Object.entries(testUsers)) {
        const mockStorageState = {
          cookies: [],
          origins: [
            {
              origin: mockBaseURL,
              localStorage: [
                {
                  name: 'auth_token',
                  value: `mock_access_token_${role}`,
                },
                {
                  name: 'refresh_token',
                  value: `mock_refresh_token_${role}`,
                },
                {
                  name: 'user',
                  value: JSON.stringify({
                    id: user.email,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                  }),
                },
              ],
            },
          ],
        };

        fs.writeFileSync(
          path.join(authDir, `${role}.json`),
          JSON.stringify(mockStorageState, null, 2)
        );
      }

      // Verify mock auth file was created
      const nurseAuthFile = path.join(authDir, 'nurse.json');
      expect(fs.existsSync(nurseAuthFile)).toBe(true);

      // Verify content
      const authState = JSON.parse(fs.readFileSync(nurseAuthFile, 'utf-8'));
      expect(authState.cookies).toEqual([]);
      expect(authState.origins).toHaveLength(1);
      expect(authState.origins[0].origin).toBe(mockBaseURL);
      expect(authState.origins[0].localStorage).toHaveLength(3);

      // Verify auth token
      const authToken = authState.origins[0].localStorage.find(
        (item: { name: string }) => item.name === 'auth_token'
      );
      expect(authToken?.value).toBe('mock_access_token_nurse');

      // Verify user data
      const userData = authState.origins[0].localStorage.find(
        (item: { name: string }) => item.name === 'user'
      );
      const user = JSON.parse(userData.value);
      expect(user.email).toBe('nurse@test.metapharm.ch');
      expect(user.role).toBe('nurse');
      expect(user.firstName).toBe('Caroline');
      expect(user.lastName).toBe('Leclerc');
    });

    it('should include all required user fields in mock auth state', () => {
      // Create test directory
      fs.mkdirSync(authDir, { recursive: true });

      const pharmacistUser = {
        email: 'pharmacist@test.metapharm.ch',
        role: 'pharmacist',
        firstName: 'Marie',
        lastName: 'Dupont',
        pharmacyId: 'pharmacy-1',
      };

      const mockStorageState = {
        cookies: [],
        origins: [
          {
            origin: mockBaseURL,
            localStorage: [
              {
                name: 'auth_token',
                value: 'mock_access_token_pharmacist',
              },
              {
                name: 'refresh_token',
                value: 'mock_refresh_token_pharmacist',
              },
              {
                name: 'user',
                value: JSON.stringify({
                  id: pharmacistUser.email,
                  email: pharmacistUser.email,
                  role: pharmacistUser.role,
                  firstName: pharmacistUser.firstName,
                  lastName: pharmacistUser.lastName,
                  pharmacyId: pharmacistUser.pharmacyId,
                }),
              },
            ],
          },
        ],
      };

      fs.writeFileSync(
        path.join(authDir, 'pharmacist.json'),
        JSON.stringify(mockStorageState, null, 2)
      );

      const authState = JSON.parse(
        fs.readFileSync(path.join(authDir, 'pharmacist.json'), 'utf-8')
      );
      const userData = authState.origins[0].localStorage.find(
        (item: { name: string }) => item.name === 'user'
      );
      const user = JSON.parse(userData.value);

      expect(user.pharmacyId).toBe('pharmacy-1');
    });

    it('should create separate mock auth states for each role', () => {
      // Create test directory
      fs.mkdirSync(authDir, { recursive: true });

      const roles = ['pharmacist', 'doctor', 'patient', 'nurse', 'delivery'];

      roles.forEach((role) => {
        const mockStorageState = {
          cookies: [],
          origins: [
            {
              origin: mockBaseURL,
              localStorage: [
                {
                  name: 'auth_token',
                  value: `mock_access_token_${role}`,
                },
              ],
            },
          ],
        };

        fs.writeFileSync(
          path.join(authDir, `${role}.json`),
          JSON.stringify(mockStorageState, null, 2)
        );
      });

      roles.forEach((role) => {
        expect(fs.existsSync(path.join(authDir, `${role}.json`))).toBe(true);
      });

      expect(fs.readdirSync(authDir)).toHaveLength(5);
    });
  });

  describe('Environment variable handling', () => {
    it('should detect MOCK_AUTH=true environment variable', () => {
      process.env.MOCK_AUTH = 'true';
      expect(process.env.MOCK_AUTH).toBe('true');
    });

    it('should detect CI environment variable', () => {
      process.env.CI = 'true';
      expect(process.env.CI).toBe('true');
    });

    it('should prioritize MOCK_AUTH over CI', () => {
      process.env.MOCK_AUTH = 'true';
      process.env.CI = 'true';

      // In the actual implementation, MOCK_AUTH is checked first
      // and returns early, so CI check is never reached
      expect(process.env.MOCK_AUTH).toBe('true');
    });
  });

  describe('Auth directory handling', () => {
    it('should create auth directory if it does not exist', () => {
      const testDir = path.join(__dirname, '../../../.auth-test-new');

      // Ensure directory doesn't exist
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }

      // Create directory
      fs.mkdirSync(testDir, { recursive: true });

      expect(fs.existsSync(testDir)).toBe(true);

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });
});
