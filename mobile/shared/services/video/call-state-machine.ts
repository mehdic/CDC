/**
 * Call State Machine
 * Manages video call state transitions and validation
 * Task: T3-009
 */

import { CallState } from './types';

/**
 * Valid state transitions for video calls
 */
const VALID_TRANSITIONS: Record<CallState, CallState[]> = {
  [CallState.IDLE]: [CallState.CONNECTING],
  [CallState.CONNECTING]: [CallState.CONNECTED, CallState.FAILED, CallState.DISCONNECTED],
  [CallState.CONNECTED]: [CallState.RECONNECTING, CallState.DISCONNECTED],
  [CallState.RECONNECTING]: [CallState.CONNECTED, CallState.FAILED, CallState.DISCONNECTED],
  [CallState.DISCONNECTED]: [CallState.CONNECTING],
  [CallState.FAILED]: [CallState.CONNECTING, CallState.IDLE],
};

/**
 * Call state machine
 * Ensures valid state transitions and provides state history
 */
export class CallStateMachine {
  private currentState: CallState = CallState.IDLE;
  private stateHistory: Array<{ state: CallState; timestamp: number }> = [];
  private listeners: Set<(state: CallState) => void> = new Set();

  constructor() {
    this.recordState(CallState.IDLE);
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return this.currentState;
  }

  /**
   * Transition to a new state
   * @throws Error if transition is invalid
   */
  transition(newState: CallState): void {
    if (!this.canTransition(newState)) {
      throw new Error(
        `Invalid state transition: ${this.currentState} → ${newState}. ` +
        `Valid transitions from ${this.currentState}: ${VALID_TRANSITIONS[this.currentState].join(', ')}`
      );
    }

    const previousState = this.currentState;
    this.currentState = newState;
    this.recordState(newState);

    console.log(`[CallStateMachine] ${previousState} → ${newState}`);

    // Notify listeners
    this.listeners.forEach((listener) => listener(newState));
  }

  /**
   * Check if transition to new state is valid
   */
  canTransition(newState: CallState): boolean {
    return VALID_TRANSITIONS[this.currentState].includes(newState);
  }

  /**
   * Get state history
   */
  getHistory(): Array<{ state: CallState; timestamp: number }> {
    return [...this.stateHistory];
  }

  /**
   * Check if currently in a specific state
   */
  is(state: CallState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if connected (CONNECTED or RECONNECTING)
   */
  isConnected(): boolean {
    return this.currentState === CallState.CONNECTED || this.currentState === CallState.RECONNECTING;
  }

  /**
   * Check if disconnected (IDLE, DISCONNECTED, or FAILED)
   */
  isDisconnected(): boolean {
    return (
      this.currentState === CallState.IDLE ||
      this.currentState === CallState.DISCONNECTED ||
      this.currentState === CallState.FAILED
    );
  }

  /**
   * Reset state machine to IDLE
   */
  reset(): void {
    this.currentState = CallState.IDLE;
    this.stateHistory = [];
    this.recordState(CallState.IDLE);
    console.log('[CallStateMachine] Reset to IDLE');
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: CallState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get duration in current state (milliseconds)
   */
  getDurationInCurrentState(): number {
    const lastEntry = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastEntry.timestamp;
  }

  /**
   * Get total call duration (time spent in CONNECTED state)
   */
  getTotalCallDuration(): number {
    return this.stateHistory
      .filter((entry) => entry.state === CallState.CONNECTED)
      .reduce((total, entry, index, array) => {
        if (index === array.length - 1 && this.currentState === CallState.CONNECTED) {
          // Current state is connected, add time since last transition
          return total + (Date.now() - entry.timestamp);
        } else if (index < array.length - 1) {
          // Add time between this CONNECTED state and next state
          return total + (array[index + 1].timestamp - entry.timestamp);
        }
        return total;
      }, 0);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private recordState(state: CallState): void {
    this.stateHistory.push({
      state,
      timestamp: Date.now(),
    });
  }
}
