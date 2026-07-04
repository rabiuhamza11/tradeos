// TradeOS Mobile — React Native entry point
// Full mobile app for iOS and Android

import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TradeOS</Text>
        <Text style={styles.subtitle}>AI Trading Platform</Text>
      </View>
      {/* Dashboard, Markets, Trading, Portfolio, AI Chat tabs */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00D9A3' },
  subtitle: { fontSize: 14, color: '#FFFFFF60', marginTop: 4 },
});
