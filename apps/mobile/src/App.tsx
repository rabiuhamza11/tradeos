import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ============ THEME ============
const COLORS = {
  bg: '#0A0E17',
  card: '#131722',
  cardLight: '#1E222D',
  accent: '#00D9A3',
  red: '#FF4757',
  green: '#00D9A3',
  text: '#FFFFFF',
  textDim: '#6A7183',
  border: '#2A2E39',
};

const API_URL = 'http://localhost:4000/api/v1';

// ============ MARKETS SCREEN ============
function MarketsScreen() {
  const [symbols] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 65432, change: 3.6, exchange: 'Binance' },
    { symbol: 'ETH', name: 'Ethereum', price: 3521, change: 2.1, exchange: 'Binance' },
    { symbol: 'SOL', name: 'Solana', price: 142, change: 8.4, exchange: 'Binance' },
    { symbol: 'AAPL', name: 'Apple Inc', price: 214, change: 1.2, exchange: 'Alpaca' },
    { symbol: 'TSLA', name: 'Tesla', price: 248, change: -2.1, exchange: 'Alpaca' },
    { symbol: 'EURUSD', name: 'Euro/USD', price: 1.0842, change: 0.3, exchange: 'OANDA' },
    { symbol: 'XAU', name: 'Gold', price: 2387, change: 0.8, exchange: 'OANDA' },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
        <Text style={styles.subtitle}>Live prices across 5 exchanges</Text>
      </View>
      <ScrollView style={styles.body}>
        {symbols.map((s) => (
          <View key={s.symbol} style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.symbol}>{s.symbol}</Text>
                <Text style={styles.dimText}>{s.name} · {s.exchange}</Text>
              </View>
              <View style={styles.rightAlign}>
                <Text style={styles.price}>${s.price.toLocaleString()}</Text>
                <Text style={[styles.change, { color: s.change >= 0 ? COLORS.green : COLORS.red }]}>
                  {s.change >= 0 ? '+' : ''}{s.change}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ TRADING SCREEN ============
function TradingScreen() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('BTC');
  const [qty, setQty] = useState('0.01');
  const [orderType, setOrderType] = useState('MARKET');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const placeOrder = () => {
    setResult(`${side} ${qty} ${symbol} @ ${orderType === 'MARKET' ? 'Market' : `$${price}`} — Order submitted!`);
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trade</Text>
      </View>
      <ScrollView style={styles.body}>
        {/* Symbol selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'EURUSD'].map((s) => (
            <TouchableOpacity key={s} onPress={() => setSymbol(s)}
              style={[styles.chip, symbol === s && styles.chipActive]}>
              <Text style={[styles.chipText, symbol === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buy/Sell toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setSide('BUY')} style={[styles.toggleBtn, side === 'BUY' && styles.buyBtn]}>
            <Text style={[styles.toggleText, side === 'BUY' && styles.toggleTextActive]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSide('SELL')} style={[styles.toggleBtn, side === 'SELL' && styles.sellBtn]}>
            <Text style={[styles.toggleText, side === 'SELL' && styles.toggleTextActive]}>SELL</Text>
          </TouchableOpacity>
        </View>

        {/* Order type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Order Type</Text>
          <View style={styles.toggleRow}>
            {['MARKET', 'LIMIT', 'STOP'].map((t) => (
              <TouchableOpacity key={t} onPress={() => setOrderType(t)}
                style={[styles.chip, orderType === t && styles.chipActive]}>
                <Text style={[styles.chipText, orderType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" />
        </View>

        {/* Price (if limit/stop) */}
        {orderType !== 'MARKET' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (USD)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.00" />
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.dimText}>Estimated Cost</Text>
            <Text style={styles.valueText}>${(parseFloat(qty || '0') * (parseFloat(price || '65432'))).toFixed(2)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.dimText}>Fee (0.1%)</Text>
            <Text style={styles.valueText}>${(parseFloat(qty || '0') * parseFloat(price || '65432') * 0.001).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={placeOrder} style={[styles.placeOrderBtn, side === 'BUY' ? styles.buyBtn : styles.sellBtn]}>
          <Text style={styles.placeOrderText}>{side} {qty} {symbol}</Text>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ PORTFOLIO SCREEN ============
function PortfolioScreen() {
  const [portfolios] = useState([
    { name: 'Crypto', value: 67850, pnl: 17850, pnlPct: 35.7 },
    { name: 'Stocks', value: 112400, pnl: 12400, pnlPct: 12.4 },
    { name: 'Forex', value: 23100, pnl: -1900, pnlPct: -7.6 },
  ]);
  const [positions] = useState([
    { symbol: 'BTC', qty: 0.85, entry: 58000, current: 65432, pnl: 6317 },
    { symbol: 'ETH', qty: 8.2, entry: 2900, current: 3521, pnl: 5072 },
    { symbol: 'SOL', qty: 120, entry: 95, current: 142, pnl: 5640 },
  ]);

  const totalValue = portfolios.reduce((s, p) => s + p.value, 0);
  const totalPnl = portfolios.reduce((s, p) => s + p.pnl, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
      </View>
      <ScrollView style={styles.body}>
        {/* Total value card */}
        <View style={styles.bigCard}>
          <Text style={styles.dimText}>Total Value</Text>
          <Text style={styles.bigValue}>${totalValue.toLocaleString()}</Text>
          <Text style={[styles.bigChange, { color: totalPnl >= 0 ? COLORS.green : COLORS.red }]}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()} ({((totalPnl / (totalValue - totalPnl)) * 100).toFixed(1)}%)
          </Text>
        </View>

        {/* Portfolios */}
        <Text style={styles.sectionTitle}>Portfolios</Text>
        {portfolios.map((p) => (
          <View key={p.name} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.portName}>{p.name}</Text>
              <Text style={styles.price}>${p.value.toLocaleString()}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.dimText}>P&L</Text>
              <Text style={[styles.change, { color: p.pnl >= 0 ? COLORS.green : COLORS.red }]}>
                {p.pnl >= 0 ? '+' : ''}{p.pnlPct}%
              </Text>
            </View>
          </View>
        ))}

        {/* Positions */}
        <Text style={styles.sectionTitle}>Open Positions</Text>
        {positions.map((pos) => (
          <View key={pos.symbol} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.symbol}>{pos.symbol}</Text>
              <Text style={[styles.change, { color: pos.pnl >= 0 ? COLORS.green : COLORS.red }]}>
                {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toLocaleString()}
              </Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.dimText}>{pos.qty} @ ${pos.entry.toLocaleString()}</Text>
              <Text style={styles.dimText}>Now: ${pos.current.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ AI SCREEN ============
function AIScreen() {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hi! Ask me about any market or strategy.' }]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: `Analysis for "${input}": Market looks bullish. Consider a long position with proper risk management.` }]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
      </View>
      <ScrollView style={styles.chatBody}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgBubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.msgText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput style={styles.chatInput} value={input} onChangeText={setInput} placeholder="Ask about markets..." placeholderTextColor={COLORS.textDim} />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============ NAVIGATION ============
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border } }}>
        <Tab.Screen name="Markets" component={MarketsScreen} options={{ tabBarIcon: () => <Text>📊</Text> }} />
        <Tab.Screen name="Trade" component={TradingScreen} options={{ tabBarIcon: () => <Text>⚡</Text> }} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ tabBarIcon: () => <Text>💰</Text> }} />
        <Tab.Screen name="AI" component={AIScreen} options={{ tabBarIcon: () => <Text>🤖</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textDim, marginTop: 4 },
  body: { flex: 1, padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  bigCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  dimText: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '600', color: COLORS.text, fontFamily: 'monospace' },
  change: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  rightAlign: { alignItems: 'flex-end' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  portName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  bigValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.text, marginVertical: 8, fontFamily: 'monospace' },
  bigChange: { fontSize: 16, fontWeight: '600' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.accent },
  chipText: { color: COLORS.textDim, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#000', fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.card, alignItems: 'center' },
  buyBtn: { backgroundColor: COLORS.green },
  sellBtn: { backgroundColor: COLORS.red },
  toggleText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDim },
  toggleTextActive: { color: '#000' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: COLORS.textDim, marginBottom: 8 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 16 },
  summaryCard: { backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 16, gap: 8 },
  valueText: { fontSize: 14, color: COLORS.text, fontFamily: 'monospace' },
  placeOrderBtn: { paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  placeOrderText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  resultCard: { backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16, marginTop: 12 },
  resultText: { color: COLORS.accent, fontSize: 14 },
  chatBody: { flex: 1, padding: 16 },
  msgBubble: { borderRadius: 16, padding: 14, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: COLORS.accent + '30', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: COLORS.card, alignSelf: 'flex-start' },
  msgText: { color: COLORS.text, fontSize: 15 },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, color: COLORS.text, fontSize: 15 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 22, color: '#000', fontWeight: 'bold' },
});
