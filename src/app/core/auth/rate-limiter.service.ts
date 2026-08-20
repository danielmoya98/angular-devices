import { Injectable, signal } from '@angular/core';

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class RateLimiterService {
  private readonly maxAttempts = 5;
  private readonly lockoutDurationMs = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly storageKeyPrefix = 'login_rate_limit_';

  // Reactive tick trigger for updating countdowns
  readonly now = signal<number>(Date.now());

  constructor() {
    // Update current timestamp every second to reactively drive lockout countdowns
    setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  private getRecord(email: string): AttemptRecord {
    const key = this.storageKeyPrefix + email.toLowerCase().trim();
    const item = localStorage.getItem(key);
    if (!item) {
      return { count: 0, lockedUntil: null };
    }
    try {
      return JSON.parse(item) as AttemptRecord;
    } catch {
      return { count: 0, lockedUntil: null };
    }
  }

  private saveRecord(email: string, record: AttemptRecord): void {
    const key = this.storageKeyPrefix + email.toLowerCase().trim();
    localStorage.setItem(key, JSON.stringify(record));
  }

  recordFailedAttempt(email: string): { isLockedNow: boolean; attemptsLeft: number; lockedUntil: number | null } {
    const record = this.getRecord(email);
    const currentTime = Date.now();

    // Reset count if previously locked out and lockout expired
    if (record.lockedUntil && currentTime > record.lockedUntil) {
      record.count = 0;
      record.lockedUntil = null;
    }

    record.count += 1;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = currentTime + this.lockoutDurationMs;
      this.saveRecord(email, record);
      return { isLockedNow: true, attemptsLeft: 0, lockedUntil: record.lockedUntil };
    }

    this.saveRecord(email, record);
    return { isLockedNow: false, attemptsLeft: this.maxAttempts - record.count, lockedUntil: null };
  }

  resetAttempts(email: string): void {
    const key = this.storageKeyPrefix + email.toLowerCase().trim();
    localStorage.removeItem(key);
  }

  isLocked(email: string): boolean {
    if (!email) return false;
    const record = this.getRecord(email);
    if (!record.lockedUntil) return false;
    
    if (this.now() < record.lockedUntil) {
      return true;
    }
    
    return false;
  }

  getLockoutSecondsRemaining(email: string): number {
    if (!email) return 0;
    const record = this.getRecord(email);
    if (!record.lockedUntil) return 0;

    const remainingMs = record.lockedUntil - this.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  getAttemptsRemaining(email: string): number {
    if (!email) return this.maxAttempts;
    const record = this.getRecord(email);
    if (this.isLocked(email)) return 0;
    return Math.max(0, this.maxAttempts - record.count);
  }
}
