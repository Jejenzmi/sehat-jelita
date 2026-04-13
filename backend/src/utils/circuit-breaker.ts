/**
 * SIMRS ZEN - Circuit Breaker
 *
 * Prevents cascading failures when external APIs (BPJS, SatuSehat) are down.
 *
 * States:
 *   CLOSED  -> normal operation, requests pass through
 *   OPEN    -> circuit tripped, requests fail fast (no outbound call)
 *   HALF_OPEN -> one probe request allowed to test recovery
 *
 * Usage:
 *   const breaker = new CircuitBreaker('bpjs', { threshold: 5, timeout: 60000 });
 *   const result = await breaker.fire(() => axios.get(...));
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  callTimeout?: number;
}

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitBreakerState;
  failures: number;
  threshold: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

export class CircuitBreakerOpenError extends Error {
  code: string;
  retryAfter: number;
  statusCode: number;

  constructor(name: string, retryAfter: number) {
    const retryIn = Math.ceil((retryAfter - Date.now()) / 1000);
    super(`Service ${name} tidak tersedia. Coba lagi dalam ${retryIn} detik.`);
    this.name = 'CircuitBreakerOpenError';
    this.code = 'CIRCUIT_OPEN';
    this.retryAfter = retryAfter;
    this.statusCode = 503;
  }
}

export class CircuitBreaker {
  name: string;
  threshold: number;
  timeout: number;
  callTimeout: number;

  state: CircuitBreakerState;
  failures: number;
  successCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;

  /**
   * @param name      - Identifier for logging
   * @param opts
   * @param opts.threshold   - Failures before opening (default 5)
   * @param opts.timeout     - Ms to wait before half-open probe (default 60s)
   * @param opts.callTimeout - Ms timeout for each call (default 10s)
   */
  constructor(name: string, opts: CircuitBreakerOptions = {}) {
    this.name = name;
    this.threshold = opts.threshold ?? 5;
    this.timeout = opts.timeout ?? 60_000;
    this.callTimeout = opts.callTimeout ?? 10_000;

    this.state = 'CLOSED';
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  get isOpen(): boolean { return this.state === 'OPEN'; }
  get isHalfOpen(): boolean { return this.state === 'HALF_OPEN'; }
  get isClosed(): boolean { return this.state === 'CLOSED'; }

  /**
   * Execute fn through the circuit breaker.
   * @param fn  - The async call to protect
   * @param fallback - Value to return when circuit is open (optional)
   */
  async fire<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
    // OPEN: fail fast unless timeout elapsed
    if (this.isOpen) {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
        if (fallback !== undefined) return fallback;
        throw new CircuitBreakerOpenError(this.name, this.nextAttemptTime);
      }
      // Transition to HALF_OPEN for probe
      this._transition('HALF_OPEN');
    }

    try {
      // Enforce per-call timeout
      const result = await Promise.race<T>([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Circuit breaker timeout: ${this.name}`)), this.callTimeout)
        ),
      ]);

      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err as Error);
      if (fallback !== undefined) return fallback;
      throw err;
    }
  }

  private _onSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = null;
    if (this.isHalfOpen) {
      this._transition('CLOSED');
      console.log(`[CircuitBreaker:${this.name}] Recovered -> CLOSED`);
    }
  }

  private _onFailure(err: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.isHalfOpen || this.failures >= this.threshold) {
      this._transition('OPEN');
      this.nextAttemptTime = Date.now() + this.timeout;
      console.warn(`[CircuitBreaker:${this.name}] OPEN after ${this.failures} failures. Retry after ${new Date(this.nextAttemptTime).toISOString()}. Last error: ${err?.message}`);
    }
  }

  private _transition(newState: CircuitBreakerState): void {
    this.state = newState;
  }

  getStatus(): CircuitBreakerStatus {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      threshold: this.threshold,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    console.log(`[CircuitBreaker:${this.name}] Manually reset -> CLOSED`);
  }
}

// -- Pre-instantiated breakers for known external services --

export const bpjsBreaker = new CircuitBreaker('bpjs', {
  threshold: 5,
  timeout: 60_000,   // 1 minute before retry
  callTimeout: 15_000,   // BPJS API can be slow
});

export const satusehatBreaker = new CircuitBreaker('satusehat', {
  threshold: 5,
  timeout: 60_000,
  callTimeout: 15_000,
});

export const icd11Breaker = new CircuitBreaker('icd11', {
  threshold: 3,
  timeout: 120_000,  // WHO API -- 2 min cooldown
  callTimeout: 8_000,
});

/** Get status of all breakers (for health check / admin panel) */
export function getAllBreakerStatus(): CircuitBreakerStatus[] {
  return [bpjsBreaker, satusehatBreaker, icd11Breaker].map(b => b.getStatus());
}
