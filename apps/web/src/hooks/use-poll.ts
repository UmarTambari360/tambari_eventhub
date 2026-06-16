'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePollOptions {
  /** Interval in milliseconds between polls. Default: 5000 */
  interval?: number;
  /** Maximum number of polls before stopping. Default: 60 (5min at 5s intervals) */
  maxAttempts?: number;
  /** Whether polling is active. Set to false to pause. */
  enabled?: boolean;
  /** Called when maxAttempts is reached without a stop condition */
  onTimeout?: () => void;
}

/**
 * Generic polling hook.
 * Calls `fn` every `interval` ms while `enabled` is true.
 * Stops when `fn` returns true (stop condition met) or maxAttempts is reached.
 *
 * @example
 * usePoll(async () => {
 *   const result = await getOrderAction(orderNumber, token);
 *   if (result.data?.status === 'paid') {
 *     setOrder(result.data);
 *     return true; // stop polling
 *   }
 *   return false; // continue
 * }, { interval: 5000, enabled: isPending });
 */
export function usePoll(
  fn: () => Promise<boolean>,
  options: UsePollOptions = {}
): void {
  const {
    interval = 5_000,
    maxAttempts = 60,
    enabled = true,
    onTimeout,
  } = options;

  const attemptsRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);

  // Keep fn ref current without re-triggering the effect
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const poll = useCallback(async () => {
    if (attemptsRef.current >= maxAttempts) {
      onTimeout?.();
      return;
    }

    attemptsRef.current += 1;

    let shouldStop = false;
    try {
      shouldStop = await fnRef.current();
    } catch {
      // Errors are non-fatal — polling continues
    }

    if (!shouldStop) {
      timeoutRef.current = setTimeout(() => {
        void poll();
      }, interval);
    }
  }, [interval, maxAttempts, onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    attemptsRef.current = 0;
    void poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, poll]);
}

/**
 * Countdown hook — returns seconds remaining until a date.
 * Returns 0 when the date has passed.
 */
export function useCountdown(targetDate: Date | null): number {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSecondsLeft = useCallback(() => {
    if (!targetDate) return 0;
    const diff = Math.floor((targetDate.getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [targetDate]);

  // This hook is intentionally simple — callers use useState + useEffect
  // with getSecondsLeft() for the display value. The hook itself manages cleanup.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return getSecondsLeft();
}