// TradeOS Mobile App — React Native
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, FlatList, Image,
} from 'react-native';

const COLORS = {
  bg: '#0A0E17',
  card: '#131722',
  border: '#2A2E39',
  green: '#00D9A3',
  red: '#FF4757',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  purple: '#A855F7',
};

// ============ LOGIN SCREEN ============

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.logoText}>TradeOS</Text>
          <Text style={styles.subtitle}>Enterprise Trading Platform</Text>
        </View>

        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.muted}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.muted}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.primaryBtn} onPress={onLogin}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ============ DASHBOARD SCREEN ============

export const DashboardScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [tickers, setTickers] = useState([
    { symbol: 'BTC', price: '$65,432', change: '+3.6%', up: true },
    { symbol: 'ETH', price: '$3,521', change: '+2.1%', up: true },
    { symbol: 'SOL', price: '$142', change: '+8.4%', up: true },
    { symbol: 'AAPL', price: '$214', change: '+1.2%', up: true },
    { symbol: 'TSLA', price: '$248', change: '-2.1%', up: false },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.headerTitle}>Dashboard</Text>

        {/* Portfolio Summary */}
        <View style={styles.card}>
          <Text style={styles.mutedText}>Total Portfolio Value</Text>
          <Text style={styles.bigValue}>$101,350.00</Text>
          <View style={styles.row}>
            <Text style={[styles.pnl, { color: COLORS.green }]}>+$13,200.00 (+15.0%)</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.mutedText}>Today's P&L</Text>
            <Text style={[styles.statValue, { color: COLORS.green }]}>+$342</Text>
          </View>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.mutedText}>Open Positions</Text>
            <Text style={styles.statValue}>8</Text>
          </View>
        </View>

        {/* Watchlist */}
        <Text style={styles.sectionTitle}>Watchlist</Text>
        <View style={styles.card}>
          {tickers.map((t) => (
            <TouchableOpacity key={t.symbol} style={styles.tickerRow} onPress={() => onNavigate('trading')}>
              <View style={styles.tickerLeft}>
                <Text style={styles.symbol}>{t.symbol}</Text>
              </View>
              <View style={styles.tickerRight}>
                <Text style={styles.price}>{t.price}</Text>
                <Text style={[styles.change, { color: t.up ? COLORS.green : COLORS.red }]}>{t.change}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.card, styles.actionBtn]} onPress={() => onNavigate('trading')}>
            <Text style={styles.actionIcon}>⚡</Text>
            <Text style={styles.actionLabel}>Trade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, styles.actionBtn]} onPress={() => onNavigate('portfolio')}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, styles.actionBtn]} onPress={() => onNavigate('agents')}>
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionLabel}>AI Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, styles.actionBtn]} onPress={() => onNavigate('analytics')}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('markets')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Markets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('trading')}>
          <Text style={styles.navIcon}>⚡</Text>
          <Text style={styles.navLabel}>Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('agents')}>
          <Text style={styles.navIcon}>🤖</Text>
          <Text style={styles.navLabel}>Agents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============ TRADING SCREEN ============

export const TradingScreen = () => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('BTC');
  const [qty, setQty] = useState('');

  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AAPL', 'TSLA', 'NVDA', 'EURUSD'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.headerTitle}>Place Order</Text>

        {/* Buy/Sell Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, side === 'BUY' && styles.buyBtn]} onPress={() => setSide('BUY')}>
            <Text style={[styles.toggleText, side === 'BUY' && styles.toggleTextActive]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, side === 'SELL' && styles.sellBtn]} onPress={() => setSide('SELL')}>
            <Text style={[styles.toggleText, side === 'SELL' && styles.toggleTextActive]}>SELL</Text>
          </TouchableOpacity>
        </View>

        {/* Symbol Picker */}
        <View style={styles.card}>
          <Text style={styles.mutedText}>Symbol</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.symbolScroll}>
            {symbols.map((s) => (
              <TouchableOpacity key={s} style={[styles.symbolChip, symbol === s && styles.symbolChipActive]} onPress={() => setSymbol(s)}>
                <Text style={[styles.symbolChipText, symbol === s && styles.symbolChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quantity */}
        <View style={styles.card}>
          <Text style={styles.mutedText}>Quantity</Text>
          <TextInput style={styles.qtyInput} placeholder="0.00" placeholderTextColor={COLORS.muted}
            value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Market Price</Text>
            <Text style={styles.summaryValue}>$65,432</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Est. Cost</Text>
            <Text style={styles.summaryValue}>${(parseFloat(qty || '0') * 65432).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Est. Fee</Text>
            <Text style={styles.summaryValue}>${(parseFloat(qty || '0') * 65432 * 0.001).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.placeOrderBtn, side === 'BUY' ? styles.buyBtn : styles.sellBtn]}>
          <Text style={styles.placeOrderText}>{side} {symbol}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============ AI AGENTS SCREEN ============

export const AgentsScreen = () => {
  const [agents, setAgents] = useState([
    { name: 'Scalper', icon: '⚡', status: 'active', pnl: '+$3,450', winRate: '68.3%', color: COLORS.red },
    { name: 'Swing', icon: '📈', status: 'active', pnl: '+$8,920', winRate: '74.5%', color: COLORS.green },
    { name: 'Arbitrage', icon: '🔄', status: 'active', pnl: '+$1,230', winRate: '98.2%', color: '#3B82F6' },
    { name: 'Sentiment', icon: '🧠', status: 'paused', pnl: '+$560', winRate: '61.0%', color: COLORS.purple },
    { name: 'Risk Manager', icon: '🛡️', status: 'active', pnl: '$0', winRate: '100%', color: '#F59E0B' },
    { name: 'Rebalancer', icon: '⚖️', status: 'paused', pnl: '+$320', winRate: '100%', color: '#10B981' },
  ]);

  const toggleAgent = (name: string) => {
    setAgents(agents.map(a => a.name === name ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.headerTitle}>AI Trading Agents</Text>

        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.mutedText}>Active</Text>
            <Text style={styles.statValue}>{agents.filter(a => a.status === 'active').length}/6</Text>
          </View>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.mutedText}>Total P&L</Text>
            <Text style={[styles.statValue, { color: COLORS.green }]}>+$14.5K</Text>
          </View>
        </View>

        <FlatList
          data={agents}
          keyExtractor={(item) => item.name}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.agentRow}>
                <View style={styles.agentLeft}>
                  <Text style={styles.agentIcon}>{item.icon}</Text>
                  <View>
                    <Text style={styles.agentName}>{item.name}</Text>
                    <Text style={styles.mutedText}>{item.winRate} win rate</Text>
                  </View>
                </View>
                <Text style={[styles.agentPnl, { color: COLORS.green }]}>{item.pnl}</Text>
              </View>
              <View style={styles.agentActions}>
                <TouchableOpacity style={[styles.agentToggle, item.status === 'active' ? styles.activeAgent : styles.pausedAgent]} onPress={() => toggleAgent(item.name)}>
                  <Text style={styles.agentToggleText}>{item.status === 'active' ? '● Active' : '○ Paused'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============ MARKETS SCREEN ============

export const MarketsScreen = () => {
  const [markets] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 65432, change: 3.6, exchange: 'Binance' },
    { symbol: 'ETH', name: 'Ethereum', price: 3521, change: 2.1, exchange: 'Binance' },
    { symbol: 'SOL', name: 'Solana', price: 142, change: 8.4, exchange: 'Binance' },
    { symbol: 'AAPL', name: 'Apple', price: 214, change: 1.2, exchange: 'Alpaca' },
    { symbol: 'TSLA', name: 'Tesla', price: 248, change: -2.1, exchange: 'Alpaca' },
    { symbol: 'NVDA', name: 'NVIDIA', price: 128, change: 4.8, exchange: 'Alpaca' },
    { symbol: 'EURUSD', name: 'Euro/USD', price: 1.0842, change: 0.3, exchange: 'OANDA' },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.headerTitle}>Markets</Text>
        <FlatList
          data={markets}
          keyExtractor={(item) => item.symbol}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.tickerRow}>
                <View style={styles.tickerLeft}>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.mutedText}>{item.name}</Text>
                </View>
                <View style={styles.tickerRight}>
                  <Text style={styles.price}>${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString()}</Text>
                  <Text style={[styles.change, { color: item.change >= 0 ? COLORS.green : COLORS.red }]}>
                    {item.change >= 0 ? '+' : ''}{item.change}%
                  </Text>
                </View>
              </View>
              <Text style={[styles.mutedText, { fontSize: 11, marginTop: 8 }]}>{item.exchange}</Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 16 },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: 12 },
  primaryBtn: { backgroundColor: COLORS.green, borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  mutedText: { color: COLORS.muted, fontSize: 12 },
  bigValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  pnl: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  tickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tickerLeft: { flexDirection: 'row', alignItems: 'center' },
  tickerRight: { alignItems: 'flex-end' },
  symbol: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  price: { fontSize: 16, fontWeight: '600', color: COLORS.text, fontFamily: 'monospace' },
  change: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionLabel: { fontSize: 11, color: COLORS.muted },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  toggleText: { color: COLORS.muted, fontWeight: '600' },
  toggleTextActive: { color: '#000' },
  buyBtn: { backgroundColor: COLORS.green },
  sellBtn: { backgroundColor: COLORS.red },
  symbolScroll: { marginTop: 8 },
  symbolChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  symbolChipActive: { backgroundColor: COLORS.green },
  symbolChipText: { color: COLORS.muted, fontWeight: '600' },
  symbolChipTextActive: { color: '#000' },
  qtyInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 14, color: COLORS.text, fontSize: 20, fontFamily: 'monospace', marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryValue: { color: COLORS.text, fontFamily: 'monospace', fontWeight: '600' },
  placeOrderBtn: { borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  placeOrderText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
  agentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  agentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentIcon: { fontSize: 28 },
  agentName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  agentPnl: { fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  agentActions: { marginTop: 12 },
  agentToggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  activeAgent: { backgroundColor: 'rgba(0,217,163,0.2)' },
  pausedAgent: { backgroundColor: 'rgba(255,255,255,0.05)' },
  agentToggleText: { fontSize: 12, color: COLORS.green, fontWeight: '600' },
});

// ============ MAIN APP ============

export default function App() {
  const [screen, setScreen] = useState('login');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => { setLoggedIn(true); setScreen('dashboard'); };
  const navigate = (s: string) => setScreen(s);

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  switch (screen) {
    case 'dashboard': return <DashboardScreen onNavigate={navigate} />;
    case 'trading': return <TradingScreen />;
    case 'agents': return <AgentsScreen />;
    case 'markets': return <MarketsScreen />;
    case 'portfolio': return <DashboardScreen onNavigate={navigate} />;
    case 'analytics': return <DashboardScreen onNavigate={navigate} />;
    case 'settings': return <DashboardScreen onNavigate={navigate} />;
    default: return <DashboardScreen onNavigate={navigate} />;
  }
}
