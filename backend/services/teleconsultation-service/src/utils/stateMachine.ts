/**
 * Teleconsultation State Machine
 * Manages consultation state transitions with validation
 * Task: T149
 * Based on: data-model.md (Teleconsultation State Machine)
 */

import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { DataSource } from 'typeorm';

/**
 * State transition map
 * scheduled → in_progress → completed
 * scheduled → cancelled
 * scheduled → no_show
 */
const VALID_TRANSITIONS: Record<
  TeleconsultationStatus,
  TeleconsultationStatus[]
> = {
  [TeleconsultationStatus.SCHEDULED]: [
    TeleconsultationStatus.IN_PROGRESS,
    TeleconsultationStatus.CANCELLED,
    TeleconsultationStatus.NO_SHOW,
  ],
  [TeleconsultationStatus.IN_PROGRESS]: [
    TeleconsultationStatus.COMPLETED,
    TeleconsultationStatus.CANCELLED, // Can cancel mid-call
  ],
  [TeleconsultationStatus.COMPLETED]: [], // Terminal state
  [TeleconsultationStatus.CANCELLED]: [], // Terminal state
  [TeleconsultationStatus.NO_SHOW]: [], // Terminal state
};

/**
 * Validate if state transition is allowed
 */
export function canTransition(
  currentStatus: TeleconsultationStatus,
  newStatus: TeleconsultationStatus
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Transition teleconsultation to new status
 * Validates transition and updates timestamps
 */
export async function transitionState(
  dataSource: DataSource,
  teleconsultationId: string,
  newStatus: TeleconsultationStatus,
  reason?: string
): Promise<Teleconsultation> {
  const repo = dataSource.getRepository(Teleconsultation);

  const teleconsultation = await repo.findOne({
    where: { id: teleconsultationId },
  });

  if (!teleconsultation) {
    throw new Error('Teleconsultation not found');
  }

  // Validate transition
  if (!canTransition(teleconsultation.status, newStatus)) {
    throw new Error(
      `Invalid state transition: ${teleconsultation.status} → ${newStatus}`
    );
  }

  // Update status
  const oldStatus = teleconsultation.status;
  teleconsultation.status = newStatus;
  teleconsultation.updated_at = new Date();

  // Update timestamps based on new status
  switch (newStatus) {
    case TeleconsultationStatus.IN_PROGRESS:
      if (!teleconsultation.started_at) {
        teleconsultation.started_at = new Date();
      }
      break;

    case TeleconsultationStatus.COMPLETED:
      teleconsultation.ended_at = new Date();
      if (teleconsultation.started_at) {
        const duration =
          teleconsultation.ended_at.getTime() -
          teleconsultation.started_at.getTime();
        teleconsultation.actual_duration_minutes = Math.round(
          duration / 1000 / 60
        );
      }
      break;

    case TeleconsultationStatus.CANCELLED:
      teleconsultation.cancelled_at = new Date();
      if (reason) {
        teleconsultation.cancellation_reason = reason;
      }
      break;

    case TeleconsultationStatus.NO_SHOW:
      // Mark as no-show but don't set cancellation reason
      break;
  }

  await repo.save(teleconsultation);

  console.log(
    `[StateMachine] Teleconsultation ${teleconsultationId}: ${oldStatus} → ${newStatus}`
  );

  return teleconsultation;
}

/**
 * Check if teleconsultation can be joined
 */
export function canJoin(teleconsultation: Teleconsultation): boolean {
  return (
    teleconsultation.status === TeleconsultationStatus.SCHEDULED ||
    teleconsultation.status === TeleconsultationStatus.IN_PROGRESS
  );
}

/**
 * Check if teleconsultation is in terminal state
 */
export function isTerminalState(status: TeleconsultationStatus): boolean {
  return (
    status === TeleconsultationStatus.COMPLETED ||
    status === TeleconsultationStatus.CANCELLED ||
    status === TeleconsultationStatus.NO_SHOW
  );
}
