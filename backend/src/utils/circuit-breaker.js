/**
 * SIMRS ZEN - Circuit Breaker
 *
 * Prevents cascading failures when external APIs (BPJS, SatuSehat) are down.
 *
 * States:
 *   CLOSED  → normal operation, requests pass through
 *   OPEN    → circuit tripped, requests fail fast (no outbound call)
 *   HALF_OPEN → one probe request allowed to test recovery
 *
 * Usage:
 *   const breaker = new CircuitBreaker('bpjs', { threshold: 5, timeout: 60000 });
 *   const result = await breaker.fire(() => axios.get(...));
 */

export class CircuitBreaker {
  /**
   * @param {string} name      - Identifier for logging
   * @param {object} opts
   * @param {number} opts.threshold   - Failures before opening (default 5)
   * @param {number} opts.timeout     - Ms to wait before half-open probe (default 60s)
   * @param {number} opts.callTimeout - Ms timeout for each call (default 10s)
   */
  constructor(name, opts = {}) {
    this.name        = name;
    this.threshold   = opts.threshold   ?? 5;
    this.timeout     = opts.timeout     ?? 60_000;
    this.callTimeout = opts.callTimeout ?? 10_000;

    this.state      = 'CLOSED';
    this.failures   = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  get isOpen()     { return this.state === 'OPEN'; }
  get isHalfOpen() { return this.state === 'HALF_OPEN'; }
  get isClosed()   { return this.state === 'CLOSED'; }

  /**
   * Execute fn through the circuit breaker.
   * @param {() => Promise<any>} fn  - The async call to protect
   * @param {any} fallback           - Value to return when circuit is open (optional)
   */
  async fire(fn, fallback = undefined) {
    // OPEN: fail fast unless timeout elapsed
    if (this.isOpen) {
      if (Date.now() < this.nextAttemptTime) {
        if (fallback !== undefined) return fallback;
        throw new CircuitBreakerOpenError(this.name, this.nextAttemptTime);
      }
      // Transition to HALF_OPEN for probe
      this._transition('HALF_OPEN');
    }

    try {
      // Enforce per-call timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Circuit breaker timeout: ${this.name}`)), this.callTimeout)
        ),
      ]);

      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      if (fallback !== undefined) return fallback;
      throw err;
    }
  }

  _onSuccess() {
    this.failures = 0;
    this.lastFailureTime = null;
    if (this.isHalfOpen) {
      this._transition('CLOSED');
      console.log(`[CircuitBreaker:${this.name}] Recovered → CLOSED`);
    }
  }

  _onFailure(err) {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.isHalfOpen || this.failures >= this.threshold) {
      this._transition('OPEN');
      this.nextAttemptTime = Date.now() + this.timeout;
      console.warn(`[CircuitBreaker:${this.name}] OPEN after ${this.failures} failures. Retry after ${new Date(this.nextAttemptTime).toISOString()}. Last error: ${err?.message}`);
    }
  }

  _transition(newState) {
    this.state = newState;
  }

  getStatus() {
    return {
      name:            this.name,
      state:           this.state,
      failures:        this.failures,
      threshold:       this.threshold,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  reset() {
    this.state      = 'CLOSED';
    this.failures   = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    console.log(`[CircuitBreaker:${this.name}] Manually reset → CLOSED`);
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(name, retryAfter) {
    const retryIn = Math.ceil((retryAfter - Date.now()) / 1000);
    super(`Service ${name} tidak tersedia. Coba lagi dalam ${retryIn} detik.`);
    this.name      = 'CircuitBreakerOpenError';
    this.code      = 'CIRCUIT_OPEN';
    this.retryAfter = retryAfter;
    this.statusCode = 503;
  }
}

// ── Pre-instantiated breakers for known external services ─────────────────────

export const bpjsBreaker = new CircuitBreaker('bpjs', {
  threshold:   5,
  timeout:     60_000,   // 1 minute before retry
  callTimeout: 15_000,   // BPJS API can be slow
});

export const satusehatBreaker = new CircuitBreaker('satusehat', {
  threshold:   5,
  timeout:     60_000,
  callTimeout: 15_000,
});

export const icd11Breaker = new CircuitBreaker('icd11', {
  threshold:   3,
  timeout:     120_000,  // WHO API — 2 min cooldown
  callTimeout: 8_000,
});

/** Get status of all breakers (for health check / admin panel) */
export function getAllBreakerStatus() {
  return [bpjsBreaker, satusehatBreaker, icd11Breaker].map(b => b.getStatus());
}
