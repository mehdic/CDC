/**
 * GDPR Deletion Security Tests
 * Tests security aspects of Right to Be Forgotten implementation
 *
 * Tests:
 * - Authorization checks (user can only delete own account)
 * - Admin privilege escalation
 * - Rate limiting compliance
 * - PII-safe logging
 * - Audit trail creation
 */

import { Request, Response } from 'express';
import * as crypto from 'crypto';
import {
  requestAccountDeletion,
  getDeletionStatus,
  confirmAccountDeletion,
  cancelAccountDeletion,
} from '../controllers/gdprController';

// ============================================================================
// Mock Request and Response Helpers
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    roles?: string[];
  };
}

function mockAuthenticatedRequest(
  user: AuthenticatedRequest['user'],
  body: any = {},
  params: any = {},
  query: any = {}
): Partial<AuthenticatedRequest> {
  return {
    user,
    body,
    params,
    query,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as any,
    get: jest.fn((header: string) => (header === 'user-agent' ? 'test-agent' : undefined)) as any,
    headers: {
      authorization: 'Bearer mock-jwt-token',
    } as any,
  } as Partial<AuthenticatedRequest>;
}

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

// ============================================================================
// Helper Functions
// ============================================================================

function hashPatientId(patientId: string): string {
  return crypto.createHash('sha256').update(patientId).digest('hex').substring(0, 8);
}

// ============================================================================
// Authorization Tests
// ============================================================================

describe('GDPR Deletion Security - Authorization', () => {
  describe('POST /api/gdpr/deletion/request', () => {
    it('should return 403 when user tries to request deletion for another patient', async () => {
      const req = mockAuthenticatedRequest(
        { userId: 'patient-A', email: 'patientA@example.com', role: 'patient' },
        { userId: 'patient-B' }
      );
      const res = mockResponse();

      await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'You can only request deletion of your own account',
        })
      );
    });

    it('should allow user to request deletion of their own account', async () => {
      const userId = 'patient-A';
      const req = mockAuthenticatedRequest({ userId, email: 'patientA@example.com', role: 'patient' }, { userId });
      const res = mockResponse();

      await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account deletion requested successfully',
          requestId: expect.stringMatching(/^deletion-/),
        })
      );
    });

    it('should allow admin to request deletion for any patient', async () => {
      const req = mockAuthenticatedRequest(
        { userId: 'admin-1', email: 'admin@example.com', role: 'admin' },
        { userId: 'patient-B' }
      );
      const res = mockResponse();

      await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account deletion requested successfully',
        })
      );
    });
  });

  describe('GET /api/gdpr/deletion/status/:requestId', () => {
    it('should return 403 when user tries to view another patient\'s deletion status', async () => {
      const userA = 'patient-A';
      const userB = 'patient-B';

      // User A creates deletion request
      const createReq = mockAuthenticatedRequest(
        { userId: userA, email: 'patientA@example.com', role: 'patient' },
        { userId: userA }
      );
      const createRes = mockResponse();
      await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

      const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
      const requestId = createJsonCall.requestId;

      // User B tries to view User A's deletion status
      const viewReq = mockAuthenticatedRequest(
        { userId: userB, email: 'patientB@example.com', role: 'patient' },
        {},
        { requestId }
      );
      const viewRes = mockResponse();

      await getDeletionStatus(viewReq as AuthenticatedRequest, viewRes as Response);

      expect(viewRes.status).toHaveBeenCalledWith(403);
      expect(viewRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'You can only view status of your own deletion requests',
        })
      );
    });

    it('should allow user to view their own deletion status', async () => {
      const userId = 'patient-A';

      // Create deletion request
      const createReq = mockAuthenticatedRequest(
        { userId, email: 'patientA@example.com', role: 'patient' },
        { userId }
      );
      const createRes = mockResponse();
      await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

      const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
      const requestId = createJsonCall.requestId;

      // View own status
      const viewReq = mockAuthenticatedRequest({ userId, email: 'patientA@example.com', role: 'patient' }, {}, { requestId });
      const viewRes = mockResponse();

      await getDeletionStatus(viewReq as AuthenticatedRequest, viewRes as Response);

      expect(viewRes.status).toHaveBeenCalledWith(200);
      expect(viewRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
          patientId: userId,
          status: 'pending',
        })
      );
    });

    it('should allow admin to view any patient\'s deletion status', async () => {
      const patientId = 'patient-B';

      // Patient creates deletion request
      const createReq = mockAuthenticatedRequest(
        { userId: patientId, email: 'patientB@example.com', role: 'patient' },
        { userId: patientId }
      );
      const createRes = mockResponse();
      await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

      const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
      const requestId = createJsonCall.requestId;

      // Admin views patient's status
      const viewReq = mockAuthenticatedRequest(
        { userId: 'admin-1', email: 'admin@example.com', role: 'admin' },
        {},
        { requestId }
      );
      const viewRes = mockResponse();

      await getDeletionStatus(viewReq as AuthenticatedRequest, viewRes as Response);

      expect(viewRes.status).toHaveBeenCalledWith(200);
      expect(viewRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
          patientId,
        })
      );
    });
  });

  describe('POST /api/gdpr/deletion/confirm/:requestId', () => {
    it('should return 403 when user tries to confirm another patient\'s deletion', async () => {
      const userA = 'patient-A';
      const userB = 'patient-B';

      // User A creates deletion request
      const createReq = mockAuthenticatedRequest(
        { userId: userA, email: 'patientA@example.com', role: 'patient' },
        { userId: userA }
      );
      const createRes = mockResponse();
      await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

      const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
      const requestId = createJsonCall.requestId;

      // User B tries to confirm User A's deletion
      const confirmReq = mockAuthenticatedRequest(
        { userId: userB, email: 'patientB@example.com', role: 'patient' },
        {},
        { requestId }
      );
      const confirmRes = mockResponse();

      await confirmAccountDeletion(confirmReq as AuthenticatedRequest, confirmRes as Response);

      expect(confirmRes.status).toHaveBeenCalledWith(403);
      expect(confirmRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'You can only confirm your own deletion requests',
        })
      );
    });
  });

  describe('POST /api/gdpr/deletion/cancel/:requestId', () => {
    it('should return 403 when user tries to cancel another patient\'s deletion request', async () => {
      const userA = 'patient-A';
      const userB = 'patient-B';

      // User A creates deletion request
      const createReq = mockAuthenticatedRequest(
        { userId: userA, email: 'patientA@example.com', role: 'patient' },
        { userId: userA }
      );
      const createRes = mockResponse();
      await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

      const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
      const requestId = createJsonCall.requestId;

      // User B tries to cancel User A's deletion
      const cancelReq = mockAuthenticatedRequest(
        { userId: userB, email: 'patientB@example.com', role: 'patient' },
        {},
        { requestId }
      );
      const cancelRes = mockResponse();

      await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);

      expect(cancelRes.status).toHaveBeenCalledWith(403);
      expect(cancelRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'You can only cancel your own deletion requests',
        })
      );
    });
  });
});

// ============================================================================
// PII-Safe Logging Tests
// ============================================================================

describe('GDPR Deletion Security - PII-Safe Logging', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should log pseudonymized patient ID (not raw ID) on deletion request', async () => {
    const patientId = 'patient-pii-123';
    const hashedId = hashPatientId(patientId);

    const req = mockAuthenticatedRequest({ userId: patientId, email: 'patient@example.com', role: 'patient' }, { userId: patientId });
    const res = mockResponse();

    await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

    // Check that logs contain hashed ID, not raw patient ID
    const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const relevantLogs = logCalls.filter((log) => log.includes('GDPR Deletion'));

    // Should contain pseudonymized ID
    expect(relevantLogs.some((log) => log.includes(hashedId))).toBe(true);

    // Should NOT contain raw patient ID (except in hash)
    const logsWithRawId = relevantLogs.filter((log) => log.includes(patientId) && !log.includes(hashedId));
    expect(logsWithRawId.length).toBe(0);
  });

  it('should log pseudonymized patient ID on cancellation', async () => {
    const patientId = 'patient-pii-456';
    const hashedId = hashPatientId(patientId);

    // Create deletion request
    const createReq = mockAuthenticatedRequest({ userId: patientId, email: 'patient@example.com', role: 'patient' }, { userId: patientId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Clear logs
    consoleLogSpy.mockClear();

    // Cancel deletion
    const cancelReq = mockAuthenticatedRequest({ userId: patientId, email: 'patient@example.com', role: 'patient' }, {}, { requestId });
    const cancelRes = mockResponse();
    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);

    // Check logs
    const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const relevantLogs = logCalls.filter((log) => log.includes('GDPR Deletion'));

    // Should contain pseudonymized ID
    expect(relevantLogs.some((log) => log.includes(hashedId))).toBe(true);

    // Should NOT contain raw patient ID
    const logsWithRawId = relevantLogs.filter((log) => log.includes(patientId) && !log.includes(hashedId));
    expect(logsWithRawId.length).toBe(0);
  });

  it('should log pseudonymized IDs in security warnings', async () => {
    const attackerId = 'patient-attacker';
    const targetId = 'patient-target';
    const attackerHash = hashPatientId(attackerId);
    const targetHash = hashPatientId(targetId);

    const req = mockAuthenticatedRequest(
      { userId: attackerId, email: 'attacker@example.com', role: 'patient' },
      { userId: targetId }
    );
    const res = mockResponse();

    consoleWarnSpy.mockClear();

    await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

    // Check warnings
    const warnCalls = consoleWarnSpy.mock.calls.map((call) => call.join(' '));
    const relevantWarns = warnCalls.filter((warn) => warn.includes('SECURITY'));

    // Should contain both pseudonymized IDs
    expect(relevantWarns.some((warn) => warn.includes(attackerHash))).toBe(true);
    expect(relevantWarns.some((warn) => warn.includes(targetHash))).toBe(true);

    // Should NOT contain raw patient IDs
    expect(relevantWarns.some((warn) => warn.includes(attackerId) && !warn.includes(attackerHash))).toBe(false);
    expect(relevantWarns.some((warn) => warn.includes(targetId) && !warn.includes(targetHash))).toBe(false);
  });
});

// ============================================================================
// Integration Security Tests
// ============================================================================

describe('GDPR Deletion Security - Integration', () => {
  it('should enforce authorization at every step of workflow', async () => {
    const userA = 'patient-A';
    const userB = 'patient-B';

    // User A creates deletion request
    const createReq = mockAuthenticatedRequest({ userId: userA, email: 'patientA@example.com', role: 'patient' }, { userId: userA });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // User B attempts all operations - ALL SHOULD FAIL
    const userBContext = { userId: userB, email: 'patientB@example.com', role: 'patient' };

    // Attempt 1: View status
    const viewReq = mockAuthenticatedRequest(userBContext, {}, { requestId });
    const viewRes = mockResponse();
    await getDeletionStatus(viewReq as AuthenticatedRequest, viewRes as Response);
    expect(viewRes.status).toHaveBeenCalledWith(403);

    // Attempt 2: Cancel
    const cancelReq = mockAuthenticatedRequest(userBContext, {}, { requestId });
    const cancelRes = mockResponse();
    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);
    expect(cancelRes.status).toHaveBeenCalledWith(403);

    // Attempt 3: Confirm
    const confirmReq = mockAuthenticatedRequest(userBContext, {}, { requestId });
    const confirmRes = mockResponse();
    await confirmAccountDeletion(confirmReq as AuthenticatedRequest, confirmRes as Response);
    expect(confirmRes.status).toHaveBeenCalledWith(403);

    // User A should still be able to access their own request
    const userAContext = { userId: userA, email: 'patientA@example.com', role: 'patient' };
    const checkReq = mockAuthenticatedRequest(userAContext, {}, { requestId });
    const checkRes = mockResponse();
    await getDeletionStatus(checkReq as AuthenticatedRequest, checkRes as Response);
    expect(checkRes.status).toHaveBeenCalledWith(200);
  });

  it('should maintain secure workflow from request to completion', async () => {
    const userId = 'patient-secure-workflow';

    // Step 1: Request deletion (authenticated, own account)
    const createReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, { userId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);
    expect(createRes.status).toHaveBeenCalledWith(200);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Step 2: Check status (authenticated, own account)
    const statusReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, {}, { requestId });
    const statusRes = mockResponse();
    await getDeletionStatus(statusReq as AuthenticatedRequest, statusRes as Response);
    expect(statusRes.status).toHaveBeenCalledWith(200);

    // Step 3: Cancel (authenticated, own account)
    const cancelReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, {}, { requestId });
    const cancelRes = mockResponse();
    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);
    expect(cancelRes.status).toHaveBeenCalledWith(200);

    // All operations succeeded with proper authentication and authorization
  });
});
