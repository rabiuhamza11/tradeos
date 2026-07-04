// TradeOS — Notifications Package
// Multi-channel notifications: email, SMS, push, and in-app

import { EventEmitter } from 'events';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationPayload {
  id: string;
  userId: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: number;
  read: boolean;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface PushConfig {
  firebaseServerKey: string;
}

export class NotificationService extends EventEmitter {
  private emailConfig: EmailConfig | null = null;
  private smsConfig: SMSConfig | null = null;
  private pushConfig: PushConfig | null = null;
  private webhookUrls: Map<string, string> = new Map();
  private queue: NotificationPayload[] = [];
  private history: NotificationPayload[] = [];

  constructor(configs?: { email?: EmailConfig; sms?: SMSConfig; push?: PushConfig }) {
    super();
    if (configs?.email) this.emailConfig = configs.email;
    if (configs?.sms) this.smsConfig = configs.sms;
    if (configs?.push) this.pushConfig = configs.push;
  }

  // ============ SEND ============

  async send(payload: Omit<NotificationPayload, 'id' | 'createdAt' | 'read'>): Promise<NotificationPayload> {
    const notification: NotificationPayload = {
      ...payload,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      read: false,
    };

    this.queue.push(notification);
    this.emit('queued', notification);

    try {
      switch (payload.channel) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPush(notification);
          break;
        case 'in_app':
          await this.sendInApp(notification);
          break;
        case 'webhook':
          await this.sendWebhook(notification);
          break;
      }
      this.emit('sent', notification);
    } catch (err: any) {
      this.emit('failed', { notification, error: err.message });
    }

    this.history.push(notification);
    this.queue = this.queue.filter((n) => n.id !== notification.id);
    return notification;
  }

  // ============ CHANNELS ============

  private async sendEmail(notif: NotificationPayload): Promise<void> {
    if (!this.emailConfig) { console.log(`📧 [EMAIL] (not configured) ${notif.title}: ${notif.message}`); return; }

    // In production: use nodemailer
    console.log(`📧 [EMAIL] To: ${notif.userId} | Subject: ${notif.title}`);
    console.log(`   Body: ${notif.message}`);
  }

  private async sendSMS(notif: NotificationPayload): Promise<void> {
    if (!this.smsConfig) { console.log(`📱 [SMS] (not configured) ${notif.title}: ${notif.message}`); return; }

    // In production: use Twilio SDK
    console.log(`📱 [SMS] To: ${notif.userId} | ${notif.title}: ${notif.message}`);
  }

  private async sendPush(notif: NotificationPayload): Promise<void> {
    if (!this.pushConfig) { console.log(`🔔 [PUSH] (not configured) ${notif.title}: ${notif.message}`); return; }

    // In production: use Firebase Admin SDK
    console.log(`🔔 [PUSH] To: ${notif.userId} | ${notif.title}: ${notif.message}`);
  }

  private async sendInApp(notif: NotificationPayload): Promise<void> {
    // In production: save to database + emit via WebSocket
    console.log(`💬 [IN-APP] To: ${notif.userId} | ${notif.title}: ${notif.message}`);
    this.emit('inApp', notif);
  }

  private async sendWebhook(notif: NotificationPayload): Promise<void> {
    const url = this.webhookUrls.get(notif.userId);
    if (!url) { console.log(`🔗 [WEBHOOK] (no URL) ${notif.title}`); return; }

    // In production: use fetch/axios to POST
    console.log(`🔗 [WEBHOOK] To: ${url} | ${notif.title}: ${notif.message}`);
  }

  // ============ CONVENIENCE METHODS ============

  async notifyTradeFilled(userId: string, symbol: string, side: string, qty: number, price: number): Promise<void> {
    await this.send({
      userId,
      channel: 'in_app',
      priority: 'normal',
      title: 'Order Filled',
      message: `${side.toUpperCase()} ${qty} ${symbol} @ $${price} executed`,
      data: { symbol, side, qty, price, type: 'trade' },
    });
  }

  async notifyPriceAlert(userId: string, symbol: string, condition: string, price: number): Promise<void> {
    await this.send({
      userId,
      channel: 'push',
      priority: 'high',
      title: 'Price Alert Triggered',
      message: `${symbol} ${condition} at $${price}`,
      data: { symbol, condition, price, type: 'alert' },
    });
  }

  async notifyRiskWarning(userId: string, message: string): Promise<void> {
    await this.send({
      userId,
      channel: 'email',
      priority: 'critical',
      title: 'Risk Warning',
      message,
      data: { type: 'risk' },
    });
  }

  async notifyDailySummary(userId: string, pnl: number, trades: number): Promise<void> {
    await this.send({
      userId,
      channel: 'email',
      priority: 'low',
      title: 'Daily Trading Summary',
      message: `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} | Trades: ${trades}`,
      data: { pnl, trades, type: 'summary' },
    });
  }

  async notifyAgentStarted(userId: string, agentName: string): Promise<void> {
    await this.send({
      userId,
      channel: 'in_app',
      priority: 'normal',
      title: 'AI Agent Started',
      message: `${agentName} has started a new trading session`,
      data: { agentName, type: 'agent' },
    });
  }

  // ============ MANAGEMENT ============

  registerWebhook(userId: string, url: string): void {
    this.webhookUrls.set(userId, url);
  }

  markAsRead(notificationId: string): void {
    const notif = this.history.find((n) => n.id === notificationId);
    if (notif) notif.read = true;
  }

  markAllAsRead(userId: string): void {
    this.history.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  }

  getHistory(userId: string, limit = 50): NotificationPayload[] {
    return this.history.filter((n) => n.userId === userId).slice(-limit).reverse();
  }

  getUnreadCount(userId: string): number {
    return this.history.filter((n) => n.userId === userId && !n.read).length;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
