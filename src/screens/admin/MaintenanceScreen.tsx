import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MaitenanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Veículos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
});