import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExchangeService } from '../common/exchange.service';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
  namespace: '/stream',
})
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private priceSubscriptions: Map<string, Set<string>> = new Map(); // symbol -> client IDs
  private isStreaming = false;

  constructor(private exchangeService: ExchangeService) {}

  async handleConnection(client: Socket) {
    console.log(`⚡ WebSocket client connected: ${client.id}`);
    client.emit('connected', { message: 'TradeOS real-time stream connected' });
  }

  handleDisconnect(client: Socket) {
    console.log(`⚡ WebSocket client disconnected: ${client.id}`);
    // Clean up subscriptions
    for (const [symbol, clients] of this.priceSubscriptions) {
      clients.delete(client.id);
      if (clients.size === 0) this.priceSubscriptions.delete(symbol);
    }
  }

  @SubscribeMessage('subscribe prices')
  handleSubscribePrices(@ConnectedSocket() client: Socket, @MessageBody() data: { symbols: string[] }) {
    for (const symbol of data.symbols) {
      if (!this.priceSubscriptions.has(symbol)) this.priceSubscriptions.set(symbol, new Set());
      this.priceSubscriptions.get(symbol)!.add(client.id);
    }
    client.emit('subscribed', { symbols: data.symbols, type: 'prices' });
    this.startPollingIfNeeded();
  }

  @SubscribeMessage('unsubscribe prices')
  handleUnsubscribePrices(@ConnectedSocket() client: Socket, @MessageBody() data: { symbols: string[] }) {
    for (const symbol of data.symbols) {
      this.priceSubscriptions.get(symbol)?.delete(client.id);
      if (this.priceSubscriptions.get(symbol)?.size === 0) this.priceSubscriptions.delete(symbol);
    }
  }

  @SubscribeMessage('get cached prices')
  handleGetCachedPrices(@ConnectedSocket() client: Socket) {
    const manager = this.exchangeService.getManager();
    // Return cached/simulated prices
    const symbols = Array.from(this.priceSubscriptions.keys());
    if (symbols.length === 0) {
      client.emit('prices', []);
      return;
    }
    // Emit current state
    client.emit('prices', symbols.map(s => ({ symbol: s, price: 0, timestamp: Date.now() })));
  }

  private async startPollingIfNeeded() {
    if (this.isStreaming || this.priceSubscriptions.size === 0) return;
    this.isStreaming = true;

    // Poll exchange for price updates every 2 seconds
    const interval = setInterval(async () => {
      if (this.priceSubscriptions.size === 0) {
        clearInterval(interval);
        this.isStreaming = false;
        return;
      }

      const symbols = Array.from(this.priceSubscriptions.keys());
      for (const symbol of symbols) {
        try {
          // Determine asset type from symbol
          const assetType = this.guessAssetType(symbol);
          const ticker = await this.exchangeService.getTicker(symbol, assetType);
          this.server.emit('price update', {
            symbol, price: ticker.price, bid: ticker.bid, ask: ticker.ask,
            volume: ticker.volume24h, changePct: ticker.changePct24h, timestamp: ticker.timestamp,
          });
        } catch (e) {
          // Silently skip failed symbols
        }
      }
    }, 2000);

    // Store interval reference for cleanup
    (this as any)._pollInterval = interval;
  }

  private guessAssetType(symbol: string): string {
    const crypto = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'LINK', 'BNB', 'XRP', 'BTCUSDT', 'ETHUSDT'];
    const forex = ['EURUSD', 'GBPUSD', 'USDJPY', 'EUR_USD', 'GBP_USD'];
    const s = symbol.toUpperCase();
    if (crypto.some(c => s.includes(c))) return 'CRYPTO';
    if (forex.some(f => s.includes(f))) return 'FOREX';
    return 'STOCK';
  }
}
