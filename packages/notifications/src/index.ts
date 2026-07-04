// TradeOS Notifications — Multi-channel notification delivery
export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
}

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms' | 'whatsapp' | 'telegram';

export class NotificationService {
  async send(payload: NotificationPayload): Promise<{ delivered: boolean; channels: string[] }> {
    const channels = payload.channels || ['in_app', 'push'];
    const results: string[] = [];

    for (const ch of channels) {
      try {
        switch (ch) {
          case 'push': results.push('push'); break;
          case 'email': results.push('email'); break;
          case 'sms': results.push('sms'); break;
          case 'whatsapp': results.push('whatsapp'); break;
          case 'telegram': results.push('telegram'); break;
          default: results.push('in_app');
        }
      } catch (e) { console.error(`Failed to send via ${ch}:`, e); }
    }

    return { delivered: results.length > 0, channels: results };
  }

  async sendPriceAlert(userId: string, symbol: string, price: number, condition: string): Promise<void> {
    await this.send({
      userId, type: 'PRICE_ALERT',
      title: `${symbol} Alert`,
      body: `${symbol} has ${condition} $${price.toFixed(2)}`,
      channels: ['in_app', 'push', 'whatsapp'],
    });
  }

  async sendTradeNotification(userId: string, action: string, symbol: string, qty: number, price: number): Promise<void> {
    await this.send({
      userId, type: 'TRADE_EXECUTED',
      title: `${action} Order Filled`,
      body: `${action} ${qty} ${symbol} at $${price.toFixed(2)}`,
      channels: ['in_app', 'push'],
    });
  }

  async sendRiskWarning(userId: string, message: string): Promise<void> {
    await this.send({
      userId, type: 'RISK_WARNING',
      title: 'Risk Warning',
      body: message,
      channels: ['in_app', 'push', 'email'],
    });
  }
}

export { NotificationService };
