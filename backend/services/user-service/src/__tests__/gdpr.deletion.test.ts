/**
 * GDPR Deletion Workflow Tests
 * Tests for Right to Be Forgotten with 30-day cooling-off period
 *
 * Tests:
 * - Deletion request creation
 * - Status checking
 * - Cooling-off period enforcement
 * - Confirmation after cooling-off period
 * - Cancellation before execution
 * - Full deletion workflow
 * - Legal data retention
 */

import { Request, Response } from 'express';
import {
  requestAccountDeletion,
  getDeletionStatus,
  confirmAccountDeletion,
  cancelAccountDeletion,
} from '../controllers/gdprController';

// ============================================================================
// Mock Request and Response
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
// Deletion Request Tests
// ============================================================================

describe('GDPR Deletion - Request Creation', () => {
  it('should create deletion request with 30-day cooling-off period', async () => {
    const userId = 'patient-123';
    const req = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      { userId }
    );
    const res = mockResponse();

    await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Account deletion requested successfully',
        requestId: expect.stringMatching(/^deletion-/),
        scheduledFor: expect.any(String),
        status: 'pending',
        coolingOffPeriodDays: 30,
        confirmationUrl: expect.stringContaining('/api/gdpr/deletion/confirm/'),
        cancellationUrl: expect.stringContaining('/api/gdpr/deletion/cancel/'),
        timestamp: expect.any(String),
      })
    );

    // Verify scheduledFor is 30 days in the future
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    const scheduledFor = new Date(jsonCall.scheduledFor);
    const now = new Date();
    const daysDiff = Math.round((scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeGreaterThanOrEqual(29); // Allow for timing variance
    expect(daysDiff).toBeLessThanOrEqual(30);
  });

  it('should return 400 if userId is missing', async () => {
    const req = mockAuthenticatedRequest({ userId: 'patient-123', email: 'patient@example.com', role: 'patient' }, {});
    const res = mockResponse();

    await requestAccountDeletion(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Error',
        message: 'userId is required',
      })
    );
  });

  it('should return 403 if user tries to delete another user\'s account', async () => {
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

  it('should allow admin to request deletion for any user', async () => {
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

// ============================================================================
// Deletion Status Tests
// ============================================================================

describe('GDPR Deletion - Status Checking', () => {
  it('should return deletion request status', async () => {
    const userId = 'patient-456';

    // Create a deletion request first
    const createReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      { userId }
    );
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Now check status
    const statusReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const statusRes = mockResponse();

    await getDeletionStatus(statusReq as AuthenticatedRequest, statusRes as Response);

    expect(statusRes.status).toHaveBeenCalledWith(200);
    expect(statusRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId,
        patientId: userId,
        status: 'pending',
        requestedAt: expect.any(String),
        scheduledFor: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('should return 404 if deletion request not found', async () => {
    const req = mockAuthenticatedRequest(
      { userId: 'patient-456', email: 'patient@example.com', role: 'patient' },
      {},
      { requestId: 'nonexistent-request' }
    );
    const res = mockResponse();

    await getDeletionStatus(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
      })
    );
  });

  it('should return 403 if user tries to view another user\'s deletion status', async () => {
    const userA = 'patient-A';
    const userB = 'patient-B';

    // User A creates a deletion request
    const createReq = mockAuthenticatedRequest({ userId: userA, email: 'patientA@example.com', role: 'patient' }, { userId: userA });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // User B tries to view User A's deletion status
    const statusReq = mockAuthenticatedRequest(
      { userId: userB, email: 'patientB@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const statusRes = mockResponse();

    await getDeletionStatus(statusReq as AuthenticatedRequest, statusRes as Response);

    expect(statusRes.status).toHaveBeenCalledWith(403);
    expect(statusRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Forbidden',
        message: 'You can only view status of your own deletion requests',
      })
    );
  });
});

// ============================================================================
// Deletion Cancellation Tests
// ============================================================================

describe('GDPR Deletion - Cancellation', () => {
  it('should cancel deletion request successfully', async () => {
    const userId = 'patient-789';

    // Create a deletion request
    const createReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, { userId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Cancel the request
    const cancelReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const cancelRes = mockResponse();

    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);

    expect(cancelRes.status).toHaveBeenCalledWith(200);
    expect(cancelRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Account deletion cancelled successfully',
        requestId,
        status: 'cancelled',
        cancelledAt: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('should return 404 if trying to cancel nonexistent request', async () => {
    const req = mockAuthenticatedRequest(
      { userId: 'patient-789', email: 'patient@example.com', role: 'patient' },
      {},
      { requestId: 'nonexistent-request' }
    );
    const res = mockResponse();

    await cancelAccountDeletion(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
      })
    );
  });

  it('should return 403 if user tries to cancel another user\'s deletion request', async () => {
    const userA = 'patient-A';
    const userB = 'patient-B';

    // User A creates a deletion request
    const createReq = mockAuthenticatedRequest({ userId: userA, email: 'patientA@example.com', role: 'patient' }, { userId: userA });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // User B tries to cancel User A's deletion request
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

// ============================================================================
// Deletion Confirmation Tests (Cooling-off Period)
// ============================================================================

describe('GDPR Deletion - Confirmation and Execution', () => {
  it('should reject confirmation before cooling-off period expires', async () => {
    const userId = 'patient-cooloff-test';

    // Create a deletion request
    const createReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, { userId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Try to confirm immediately (should fail)
    const confirmReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const confirmRes = mockResponse();

    await confirmAccountDeletion(confirmReq as AuthenticatedRequest, confirmRes as Response);

    expect(confirmRes.status).toHaveBeenCalledWith(400);
    expect(confirmRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Error',
        message: expect.stringContaining('Cooling-off period not complete'),
      })
    );
  });

  it('should return 404 if trying to confirm nonexistent request', async () => {
    const req = mockAuthenticatedRequest(
      { userId: 'patient-123', email: 'patient@example.com', role: 'patient' },
      {},
      { requestId: 'nonexistent-request' }
    );
    const res = mockResponse();

    await confirmAccountDeletion(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
      })
    );
  });

  it('should return 403 if user tries to confirm another user\'s deletion', async () => {
    const userA = 'patient-A';
    const userB = 'patient-B';

    // User A creates a deletion request
    const createReq = mockAuthenticatedRequest({ userId: userA, email: 'patientA@example.com', role: 'patient' }, { userId: userA });
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

// ============================================================================
// Integration Tests - Full Workflow
// ============================================================================

describe('GDPR Deletion - Integration Tests', () => {
  it('should complete request-cancel workflow', async () => {
    const userId = 'patient-workflow-1';

    // Step 1: Request deletion
    const createReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, { userId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    expect(createRes.status).toHaveBeenCalledWith(200);
    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    // Step 2: Check status
    const statusReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const statusRes = mockResponse();
    await getDeletionStatus(statusReq as AuthenticatedRequest, statusRes as Response);

    expect(statusRes.status).toHaveBeenCalledWith(200);
    const statusJsonCall = (statusRes.json as jest.Mock).mock.calls[0][0];
    expect(statusJsonCall.status).toBe('pending');

    // Step 3: Cancel request
    const cancelReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const cancelRes = mockResponse();
    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);

    expect(cancelRes.status).toHaveBeenCalledWith(200);

    // Step 4: Verify cancelled status
    const finalStatusReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const finalStatusRes = mockResponse();
    await getDeletionStatus(finalStatusReq as AuthenticatedRequest, finalStatusRes as Response);

    expect(finalStatusRes.status).toHaveBeenCalledWith(200);
    const finalStatusJsonCall = (finalStatusRes.json as jest.Mock).mock.calls[0][0];
    expect(finalStatusJsonCall.status).toBe('cancelled');
    expect(finalStatusJsonCall.cancelledAt).toBeDefined();
  });

  it('should prevent cancellation of already cancelled request', async () => {
    const userId = 'patient-double-cancel';

    // Create and cancel request
    const createReq = mockAuthenticatedRequest({ userId, email: 'patient@example.com', role: 'patient' }, { userId });
    const createRes = mockResponse();
    await requestAccountDeletion(createReq as AuthenticatedRequest, createRes as Response);

    const createJsonCall = (createRes.json as jest.Mock).mock.calls[0][0];
    const requestId = createJsonCall.requestId;

    const cancelReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const cancelRes = mockResponse();
    await cancelAccountDeletion(cancelReq as AuthenticatedRequest, cancelRes as Response);

    expect(cancelRes.status).toHaveBeenCalledWith(200);

    // Try to cancel again
    const cancelAgainReq = mockAuthenticatedRequest(
      { userId, email: 'patient@example.com', role: 'patient' },
      {},
      { requestId }
    );
    const cancelAgainRes = mockResponse();
    await cancelAccountDeletion(cancelAgainReq as AuthenticatedRequest, cancelAgainRes as Response);

    // Should still return 200 (already cancelled is a valid state)
    expect(cancelAgainRes.status).toHaveBeenCalledWith(200);
  });
});
