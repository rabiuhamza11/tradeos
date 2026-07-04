// TradeOS — Cybersecurity Package
// API key encryption, session management, and security auditing

import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface SecurityAudit {
  id: string;
  timestamp: number;
  score: number;
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface Vulnerability {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  remediation: string;
  cve?: string;
}

export interface ApiKeyStore {
  encrypted: string;
  iv: string;
  salt: string;
  createdAt: number;
  lastAccessed?: number;
}

export class SecurityManager extends EventEmitter {
  private masterKey: string;
  private algorithm = 'aes-256-gcm';
  private keyStore: Map<string, ApiKeyStore> = new Map();
  private sessions: Map<string, SessionData> = new Map();
  private auditLog: SecurityAudit[] = [];

  constructor(masterKey?: string) {
    super();
    this.masterKey = masterKey || crypto.randomBytes(32).toString('hex');
  }

  // ============ API KEY ENCRYPTION ============

  encryptApiKey(key: string, identifier: string): ApiKeyStore {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(64);
    const derivedKey = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');
    const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);

    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const store: ApiKeyStore = {
      encrypted: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      createdAt: Date.now(),
    };

    this.keyStore.set(identifier, store);
    this.emit('keyEncrypted', { identifier });
    return store;
  }

  decryptApiKey(identifier: string): string | null {
    const store = this.keyStore.get(identifier);
    if (!store) return null;

    try {
      const [encrypted, authTagHex] = store.encrypted.split(':');
      const iv = Buffer.from(store.iv, 'hex');
      const salt = Buffer.from(store.salt, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const derivedKey = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');

      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      store.lastAccessed = Date.now();
      return decrypted;
    } catch (error) {
      this.emit('decryptionFailed', { identifier, error });
      return null;
    }
  }

  hasApiKey(identifier: string): boolean {
    return this.keyStore.has(identifier);
  }

  deleteApiKey(identifier: string): void {
    this.keyStore.delete(identifier);
    this.emit('keyDeleted', { identifier });
  }

  listApiKeyIdentifiers(): string[] {
    return Array.from(this.keyStore.keys());
  }

  // ============ SESSION MANAGEMENT ============

  createSession(userId: string, metadata?: any): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000, // 24 hours
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      twoFactorVerified: metadata?.twoFactorVerified || false,
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', { userId, sessionId });
    return sessionId;
  }

  validateSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      this.emit('sessionExpired', { sessionId });
      return null;
    }
    return session;
  }

  extendSession(sessionId: string, ms = 3600000): void {
    const session = this.sessions.get(sessionId);
    if (session) session.expiresAt = Date.now() + ms;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.emit('sessionDestroyed', { sessionId });
  }

  destroyAllUserSessions(userId: string): void {
    for (const [id, session] of this.sessions) {
      if (session.userId === userId) this.sessions.delete(id);
    }
    this.emit('allSessionsDestroyed', { userId });
  }

  getActiveSessions(userId?: string): SessionData[] {
    const sessions = Array.from(this.sessions.values()).filter((s) => Date.now() < s.expiresAt);
    if (userId) return sessions.filter((s) => s.userId === userId);
    return sessions;
  }

  // ============ SECURITY AUDIT ============

  async runSecurityAudit(config: {
    checkDependencies?: boolean;
    checkApiKeys?: boolean;
    checkSessions?: boolean;
    checkNetwork?: boolean;
  }): Promise<SecurityAudit> {
    const vulnerabilities: Vulnerability[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check API key security
    if (config.checkApiKeys !== false) {
      const storedKeys = this.listApiKeyIdentifiers();
      if (storedKeys.length === 0) {
        recommendations.push('No API keys stored — good security posture');
      }

      // Check for keys that haven't been accessed in 30 days
      const staleKeys = storedKeys.filter((id) => {
        const store = this.keyStore.get(id);
        return store && (!store.lastAccessed || Date.now() - store.lastAccessed > 30 * 86400000);
      });

      if (staleKeys.length > 0) {
        vulnerabilities.push({
          id: 'STALE_KEYS',
          severity: 'LOW',
          category: 'API Key Management',
          description: `${staleKeys.length} API keys haven't been accessed in 30+ days`,
          remediation: 'Remove unused API keys to reduce attack surface',
        });
        score -= 5;
      }
    }

    // Check session security
    if (config.checkSessions !== false) {
      const activeSessions = this.getActiveSessions();
      const oldSessions = activeSessions.filter((s) => Date.now() - s.createdAt > 12 * 3600000);

      if (oldSessions.length > 0) {
        vulnerabilities.push({
          id: 'OLD_SESSIONS',
          severity: 'LOW',
          category: 'Session Management',
          description: `${oldSessions.length} sessions older than 12 hours`,
          remediation: 'Consider shorter session timeout for sensitive operations',
        });
        score -= 5;
      }

      const unverified2FA = activeSessions.filter((s) => !s.twoFactorVerified);
      if (unverified2FA.length > 0) {
        vulnerabilities.push({
          id: 'NO_2FA',
          severity: 'MEDIUM',
          category: 'Authentication',
          description: `${unverified2FA.length} sessions without 2FA verification`,
          remediation: 'Require 2FA for trading operations',
        });
        score -= 15;
      }
    }

    // Check for common trading platform vulnerabilities
    if (config.checkDependencies !== false) {
      vulnerabilities.push({
        id: 'DEP_CHECK',
        severity: 'INFO',
        category: 'Dependencies',
        description: 'Run npm audit to check for known vulnerabilities in dependencies',
        remediation: 'Execute `npm audit --fix` regularly',
      });
    }

    if (config.checkNetwork !== false) {
      recommendations.push('Enable IP whitelist for API endpoints');
      recommendations.push('Use HTTPS only — redirect all HTTP traffic');
      recommendations.push('Enable rate limiting on all public endpoints');
      recommendations.push('Set CORS to only allow trusted origins');
    }

    score = Math.max(0, score);
    const status = score >= 80 ? 'PASS' : score >= 50 ? 'WARN' : 'FAIL';

    const audit: SecurityAudit = {
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      score,
      vulnerabilities,
      recommendations,
      status,
    };

    this.auditLog.push(audit);
    this.emit('auditComplete', audit);
    return audit;
  }

  getAuditHistory(limit = 10): SecurityAudit[] {
    return this.auditLog.slice(-limit).reverse();
  }

  // ============ UTILITIES ============

  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: useSalt };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
  }

  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateApiKey(prefix = 'tk_'): string {
    return `${prefix}${crypto.randomBytes(24).toString('hex')}`;
  }

  // ============ IP WHITELIST ============

  private ipWhitelist: Set<string> = new Set();

  addToWhitelist(ip: string): void { this.ipWhitelist.add(ip); }
  removeFromWhitelist(ip: string): void { this.ipWhitelist.delete(ip); }
  isWhitelisted(ip: string): boolean { return this.ipWhitelist.has(ip); }
  getWhitelist(): string[] { return Array.from(this.ipWhitelist); }
}

interface SessionData {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  twoFactorVerified: boolean;
}
