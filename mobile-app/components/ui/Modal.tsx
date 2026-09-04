import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../lib/theme/theme';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
            style,
          ]}
        >
          {title && (
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.text, fontSize: theme.typography.sizes.lg },
                ]}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text
                  style={[
                    styles.closeText,
                    { color: theme.colors.textSecondary, fontSize: theme.typography.sizes['2xl'] },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    lineHeight: 24,
  },
  body: {
    padding: 16,
  },
});
