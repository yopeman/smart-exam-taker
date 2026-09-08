import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../lib/theme/theme';

interface SecurityWarningProps {
  visible: boolean;
  message: string;
  countdown?: number;
  severity?: 'warning' | 'error';
}

export function SecurityWarning({ visible, message, countdown, severity = 'warning' }: SecurityWarningProps) {
  const { theme } = useTheme();

  const backgroundColor = severity === 'error' ? theme.colors.error : theme.colors.warning;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: backgroundColor }]}>
          <Text style={[styles.icon, { color: '#FFFFFF' }]}>
            {severity === 'error' ? '⛔' : '⚠️'}
          </Text>
          <Text style={[styles.message, { color: '#FFFFFF' }]}>
            {message}
          </Text>
          {countdown !== undefined && countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownText, { color: '#FFFFFF' }]}>
                Auto-submit in: {countdown}s
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 16,
    margin: 32,
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
