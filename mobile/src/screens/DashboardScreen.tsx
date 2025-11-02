import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { apiService } from '../services/api';
import type { ReceiptData } from '../types';

export default function DashboardScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      apiService.setAuthToken(token || null);
      const response = await apiService.getReceipts();
      setReceipts(response.receipts || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Receipts</Text>
        <Text style={styles.subtitle}>
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No receipts yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first receipt to get started
          </Text>
        </View>
      ) : (
        receipts.map((receipt) => (
          <TouchableOpacity key={receipt.id} style={styles.receiptCard}>
            <Text style={styles.receiptItem}>{receipt.item}</Text>
            <Text style={styles.receiptStore}>{receipt.store}</Text>
            <Text style={styles.receiptAmount}>
              ${receipt.amount} {receipt.currency}
            </Text>
            <Text style={styles.receiptDate}>
              Expires: {new Date(receipt.warranty_expiry).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#aaa',
    fontSize: 14,
  },
  receiptCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  receiptItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  receiptStore: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#888',
  },
});

