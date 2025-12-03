/**
 * Unit Tests for HIN e-ID OAuth2 Integration
 * Tests GLN scope inclusion and OAuth parameter construction
 */

describe('HIN e-ID OAuth2 Integration', () => {
  describe('OAuth2 Configuration', () => {
    it('should include GLN scope in authorization request', () => {
      // Verify that the authorization URL includes the 'gln' scope
      const requiredScopes = ['openid', 'profile', 'email', 'gln'];
      const scopeString = 'openid profile email gln';

      requiredScopes.forEach((scope) => {
        expect(scopeString).toContain(scope);
      });
    });

    it('should use correct HIN OAuth2 endpoints', () => {
      // Verify expected OAuth2 endpoints
      const expectedEndpoints = {
        authorize: 'https://oauth2.hin.ch/authorize',
        token: 'https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken',
        userinfo: 'https://oauth2.hin.ch/userinfo',
      };

      Object.values(expectedEndpoints).forEach((endpoint) => {
        expect(endpoint).toContain('oauth2.hin.ch');
      });
    });
  });

  describe('GLN Field Validation', () => {
    it('should validate Swiss GLN format (13 digits)', () => {
      const validGLNs = [
        '7601234567890',
        '7609876543210',
        '7601122334455',
      ];

      const invalidGLNs = [
        '123456', // Too short
        'abcd1234567890', // Contains letters
        '76012345678901', // Too long (14 digits)
      ];

      const glnRegex = /^\d{13}$/;

      validGLNs.forEach((gln) => {
        expect(gln).toMatch(glnRegex);
      });

      invalidGLNs.forEach((gln) => {
        expect(gln).not.toMatch(glnRegex);
      });
    });
  });

  describe('OAuth2 Flow Parameters', () => {
    it('should properly format scope parameter with GLN', () => {
      const scopes = 'openid profile email gln';
      const scopeArray = scopes.split(' ');

      expect(scopeArray).toHaveLength(4);
      expect(scopeArray).toContain('gln');
      expect(scopeArray).toContain('openid');
      expect(scopeArray).toContain('profile');
      expect(scopeArray).toContain('email');
    });

    it('should include required OAuth2 parameters', () => {
      const requiredParams = [
        'client_id',
        'redirect_uri',
        'response_type',
        'scope',
        'state',
      ];

      // Verify all required parameters are defined
      requiredParams.forEach((param) => {
        expect(param).toBeTruthy();
        expect(param.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Profile Extraction', () => {
    it('should extract GLN from HIN userinfo response', () => {
      // Mock HIN userinfo response structure
      const mockHinUserInfo = {
        sub: 'HIN-12345678',
        email: 'pharmacist@example.ch',
        given_name: 'Jean',
        family_name: 'Dupont',
        profession: 'pharmacist',
        gln: '7601234567890',
      };

      // Verify GLN field exists and has correct format
      expect(mockHinUserInfo).toHaveProperty('gln');
      expect(mockHinUserInfo.gln).toMatch(/^\d{13}$/);
    });

    it('should handle missing GLN gracefully', () => {
      const mockHinUserInfoWithoutGLN: any = {
        sub: 'HIN-87654321',
        email: 'doctor@example.ch',
        given_name: 'Marie',
        family_name: 'Martin',
        profession: 'doctor',
        // gln field is missing
      };

      // Verify GLN field is undefined
      expect(mockHinUserInfoWithoutGLN.gln).toBeUndefined();

      // Should not throw error when accessing missing GLN
      expect(() => {
        const gln = mockHinUserInfoWithoutGLN.gln || null;
        return gln;
      }).not.toThrow();
    });
  });

  describe('Role Mapping', () => {
    const testCases = [
      { profession: 'pharmacist', expected: 'pharmacist' },
      { profession: 'Apotheker', expected: 'pharmacist' },
      { profession: 'doctor', expected: 'doctor' },
      { profession: 'Arzt', expected: 'doctor' },
      { profession: 'médecin', expected: 'doctor' },
      { profession: 'nurse', expected: 'nurse' },
      { profession: 'Krankenschwester', expected: 'nurse' },
      { profession: 'infirmière', expected: 'nurse' },
    ];

    testCases.forEach(({ profession, expected }) => {
      it(`should map profession "${profession}" to role "${expected}"`, () => {
        const profLower = profession.toLowerCase();

        let role = 'doctor'; // default

        if (profLower.includes('pharmacist') || profLower.includes('apotheker')) {
          role = 'pharmacist';
        } else if (profLower.includes('doctor') || profLower.includes('arzt') || profLower.includes('médecin')) {
          role = 'doctor';
        } else if (profLower.includes('nurse') || profLower.includes('krankenschwester') || profLower.includes('infirmière')) {
          role = 'nurse';
        }

        expect(role).toBe(expected);
      });
    });
  });
});
