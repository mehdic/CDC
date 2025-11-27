/**
 * Call State Machine Tests
 * Task: T3-012
 */

import { CallStateMachine } from '../call-state-machine';
import { CallState } from '../types';

describe('CallStateMachine', () => {
  let stateMachine: CallStateMachine;

  beforeEach(() => {
    stateMachine = new CallStateMachine();
  });

  describe('Initial State', () => {
    it('should start in IDLE state', () => {
      expect(stateMachine.getState()).toBe(CallState.IDLE);
    });

    it('should record initial state in history', () => {
      const history = stateMachine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].state).toBe(CallState.IDLE);
    });
  });

  describe('Valid Transitions', () => {
    it('should allow IDLE → CONNECTING', () => {
      expect(() => stateMachine.transition(CallState.CONNECTING)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.CONNECTING);
    });

    it('should allow CONNECTING → CONNECTED', () => {
      stateMachine.transition(CallState.CONNECTING);
      expect(() => stateMachine.transition(CallState.CONNECTED)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.CONNECTED);
    });

    it('should allow CONNECTED → RECONNECTING', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);
      expect(() => stateMachine.transition(CallState.RECONNECTING)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.RECONNECTING);
    });

    it('should allow RECONNECTING → CONNECTED', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);
      stateMachine.transition(CallState.RECONNECTING);
      expect(() => stateMachine.transition(CallState.CONNECTED)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.CONNECTED);
    });

    it('should allow CONNECTED → DISCONNECTED', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);
      expect(() => stateMachine.transition(CallState.DISCONNECTED)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.DISCONNECTED);
    });

    it('should allow CONNECTING → FAILED', () => {
      stateMachine.transition(CallState.CONNECTING);
      expect(() => stateMachine.transition(CallState.FAILED)).not.toThrow();
      expect(stateMachine.getState()).toBe(CallState.FAILED);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject IDLE → CONNECTED', () => {
      expect(() => stateMachine.transition(CallState.CONNECTED)).toThrow(
        /Invalid state transition/
      );
    });

    it('should reject IDLE → RECONNECTING', () => {
      expect(() => stateMachine.transition(CallState.RECONNECTING)).toThrow();
    });

    it('should reject CONNECTED → CONNECTING', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);
      expect(() => stateMachine.transition(CallState.CONNECTING)).toThrow();
    });
  });

  describe('State Checks', () => {
    it('should correctly identify current state with is()', () => {
      expect(stateMachine.is(CallState.IDLE)).toBe(true);
      stateMachine.transition(CallState.CONNECTING);
      expect(stateMachine.is(CallState.CONNECTING)).toBe(true);
      expect(stateMachine.is(CallState.IDLE)).toBe(false);
    });

    it('should correctly identify connected states', () => {
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition(CallState.CONNECTING);
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition(CallState.CONNECTED);
      expect(stateMachine.isConnected()).toBe(true);

      stateMachine.transition(CallState.RECONNECTING);
      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should correctly identify disconnected states', () => {
      expect(stateMachine.isDisconnected()).toBe(true);

      stateMachine.transition(CallState.CONNECTING);
      expect(stateMachine.isDisconnected()).toBe(false);

      stateMachine.transition(CallState.FAILED);
      expect(stateMachine.isDisconnected()).toBe(true);
    });
  });

  describe('State History', () => {
    it('should record all state transitions', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);

      const history = stateMachine.getHistory();
      expect(history).toHaveLength(3); // IDLE + CONNECTING + CONNECTED
      expect(history[0].state).toBe(CallState.IDLE);
      expect(history[1].state).toBe(CallState.CONNECTING);
      expect(history[2].state).toBe(CallState.CONNECTED);
    });

    it('should record timestamps for each transition', () => {
      const before = Date.now();
      stateMachine.transition(CallState.CONNECTING);
      const after = Date.now();

      const history = stateMachine.getHistory();
      const lastTransition = history[history.length - 1];
      expect(lastTransition.timestamp).toBeGreaterThanOrEqual(before);
      expect(lastTransition.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Reset', () => {
    it('should reset to IDLE state', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);
      stateMachine.reset();

      expect(stateMachine.getState()).toBe(CallState.IDLE);
    });

    it('should clear history on reset', () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.reset();

      const history = stateMachine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].state).toBe(CallState.IDLE);
    });
  });

  describe('Subscriptions', () => {
    it('should notify listeners on state change', () => {
      const listener = jest.fn();
      stateMachine.subscribe(listener);

      stateMachine.transition(CallState.CONNECTING);
      expect(listener).toHaveBeenCalledWith(CallState.CONNECTING);
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      stateMachine.subscribe(listener1);
      stateMachine.subscribe(listener2);

      stateMachine.transition(CallState.CONNECTING);

      expect(listener1).toHaveBeenCalledWith(CallState.CONNECTING);
      expect(listener2).toHaveBeenCalledWith(CallState.CONNECTING);
    });

    it('should allow unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = stateMachine.subscribe(listener);

      stateMachine.transition(CallState.CONNECTING);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateMachine.transition(CallState.CONNECTED);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('Duration Tracking', () => {
    it('should track duration in current state', async () => {
      stateMachine.transition(CallState.CONNECTING);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = stateMachine.getDurationInCurrentState();
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should track total call duration', async () => {
      stateMachine.transition(CallState.CONNECTING);
      stateMachine.transition(CallState.CONNECTED);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = stateMachine.getTotalCallDuration();
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('canTransition', () => {
    it('should correctly report valid transitions', () => {
      expect(stateMachine.canTransition(CallState.CONNECTING)).toBe(true);
      expect(stateMachine.canTransition(CallState.CONNECTED)).toBe(false);
    });

    it('should update after state change', () => {
      stateMachine.transition(CallState.CONNECTING);
      expect(stateMachine.canTransition(CallState.CONNECTED)).toBe(true);
      expect(stateMachine.canTransition(CallState.IDLE)).toBe(false);
    });
  });
});
