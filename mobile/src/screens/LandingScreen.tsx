import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useClerk } from '@clerk/clerk-expo';
import { Receipt } from 'lucide-react-native';

export default function LandingScreen() {
  const { openSignIn } = useClerk();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Receipt size={32} color="#3b82f6" />
          <View style={{ width: 8 }} />
          <Text style={styles.logoText}>Retreat</Text>
        </View>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => openSignIn()}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Never Lose{'\n'}
          <Text style={styles.titleAccent}>Your Receipts</Text>{'\n'}
          Again
        </Text>

        <Text style={styles.subtitle}>
          Automatically track warranties, get expiry reminders, and never miss
          a claim. Just forward your receipts and let us handle the rest.
        </Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => openSignIn()}
        >
          <Text style={styles.ctaText}>Get Started Free</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  signInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleAccent: {
    color: '#60a5fa',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

