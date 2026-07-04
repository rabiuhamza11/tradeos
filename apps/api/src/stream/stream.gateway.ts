// TradeOS — WebSocket Gateway (Socket.IO)
// Real-time streaming server for market data, order updates, and portfolio changes

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BinanceWS } from '../../../packages/exchange-adapters/src/binance-ws';
import { CoinbaseWS } from '../../../packages/exchange-adapters/src/coinbase-ws';

@WebSocketGateway({
  namespace: 'stream',
  cors: { origin: process.env.WS_CORS_ORIGIN || 'http://localhost:3000', credentials: true },
})
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('StreamGateway');
  private binanceWS: BinanceWS;
  private coinbaseWS: CoinbaseWS;
  private clientRooms: Map<string, Set<string>> = new Map();

  constructor() {
    this.binanceWS = new BinanceWS(true);
    this.coinbaseWS = new CoinbaseWS(true);

    // Forward Binance events to clients
    this.binanceWS.on('ticker', (ticker) => {
      this.server.to('binance:ticker').emit('ticker', { exchange: 'binance', ...ticker });
    });
    this.binanceWS.on('candle', (data) => {
      this.server.to(`binance:kline:${data.symbol}`).emit('candle', { exchange: 'binance', ...data });
    });
    this.binanceWS.on('orderbook', (book) => {
      this.server.to(`binance:depth:${book.symbol}`).emit('orderbook', { exchange: 'binance', ...book });
    });

    // Forward Coinbase events
    this.coinbaseWS.on('ticker', (ticker) => {
      this.server.to('coinbase:ticker').emit('ticker', { exchange: 'coinbase', ...ticker });
    });
    this.coinbaseWS.on('trade', (trade) => {
      this.server.to('coinbase:trade').emit('trade', { exchange: 'coinbase', ...trade });
    });
  }

  // ============ CONNECTION MANAGEMENT ============

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    this.clientRooms.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`⚠️ Client disconnected: ${client.id}`);
    this.clientRooms.delete(client.id);
  }

  // ============ SUBSCRIPTION MANAGEMENT ============

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { channel: string; symbols?: string[] }, @ConnectedSocket() client: Socket) {
    const { channel, symbols } = data;
    const room = symbols ? `${channel}:${symbols.join(',')}` : channel;

    client.join(room);
    this.clientRooms.get(client.id)?.add(room);

    this.logger.log(`📡 Client ${client.id} subscribed to: ${room}`);

    // Start Binance WS if not already connected
    if (channel.includes('binance') && !this.binanceWS.isConnected()) {
      const allSymbols = symbols?.map((s) => s.toUpperCase()) || ['BTCUSDT', 'ETHUSDT'];
      const streams = ['ticker', 'kline_1m'];
      this.binanceWS.connect(allSymbols, streams);
    }

    // Start Coinbase WS if needed
    if (channel.includes('coinbase') && !this.coinbaseWS.isConnected()) {
      const products = symbols?.map((s) => `${s}-USD`) || ['BTC-USD', 'ETH-USD'];
      this.coinbaseWS.connect(products, ['ticker', 'matches']);
    }

    client.emit('subscribed', { room, timestamp: Date.now() });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: { channel: string; symbols?: string[] }, @ConnectedSocket() client: Socket) {
    const { channel, symbols } = data;
    const room = symbols ? `${channel}:${symbols.join(',')}` : channel;

    client.leave(room);
    this.clientRooms.get(client.id)?.delete(room);

    this.logger.log(`📡 Client ${client.id} unsubscribed from: ${room}`);
    client.emit('unsubscribed', { room });
  }

  // ============ CUSTOM EVENTS ============

  @SubscribeMessage('getStreamStatus')
  handleStreamStatus(@ConnectedSocket() client: Socket) {
    client.emit('streamStatus', {
      binance: { connected: this.binanceWS.isConnected(), streams: this.binanceWS.getStreamCount() },
      coinbase: { connected: this.coinbaseWS.isConnected() },
      clients: this.server.engine.clientsCount,
    });
  }

  // ============ BROADCAST HELPERS ============

  broadcastOrderUpdate(userId: string, order: any) {
    this.server.to(`user:${userId}`).emit('orderUpdate', order);
  }

  broadcastPortfolioUpdate(userId: string, portfolio: any) {
    this.server.to(`user:${userId}`).emit('portfolioUpdate', portfolio);
  }

  broadcastAlert(userId: string, alert: any) {
    this.server.to(`user:${userId}`).emit('alert', alert);
  }

  broadcastNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // ============ HEALTH ============

  getHealth() {
    return {
      binance: this.binanceWS.isConnected(),
      coinbase: this.coinbaseWS.isConnected(),
      connectedClients: this.server?.engine?.clientsCount || 0,
    };
  }
}
