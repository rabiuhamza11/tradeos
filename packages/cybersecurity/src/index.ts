// TradeOS Cybersecurity — Security auditing, encryption, threat detection
import * as crypto from 'crypto';

export class SecurityAuditor {
  auditTradingAPI(apiKey: string): { secure: boolean; issues: string[] } {
    const issues: string[] = [];
    if (apiKey.length < 20) issues.push('API key too short');
    if (apiKey.includes('test') && process.env.NODE_ENV === 'production') issues.push('Test key in production');
    return { secure: issues.length === 0, issues };
  }

  auditPortfolio(portfolio: any): { riskScore: number; vulnerabilities: string[] } {
    const vulns: string[] = [];
    if (portfolio.concentration > 0.4) vulns.push('High concentration risk');
    if (!portfolio.stopLoss) vulns.push('No stop-loss configured');
    const riskScore = Math.min(100, vulns.length * 30 + 20);
    return { riskScore, vulnerabilities: vulns };
  }
}

export class EncryptionService {
  private algorithm = 'aes-256-gcm';

  encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key.padEnd(32, '0').substring(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string, key: string): string {
    const [ivHex, data] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key.padEnd(32, '0').substring(0, 32)), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export class ThreatDetector {
  detectSuspiciousActivity(activity: any): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (activity.frequency > 100) reasons.push('Unusually high trading frequency');
    if (activity.amount > 100000) reasons.push('Large transaction amount');
    if (activity.failedAttempts > 5) reasons.push('Multiple failed attempts');
    return { suspicious: reasons.length > 0, reasons };
  }
}

export { SecurityAuditor, EncryptionService, ThreatDetector };
