import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmailSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Email Settings</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
  subtext: {
    color: '#aaa',
    marginTop: 8,
  },
});

