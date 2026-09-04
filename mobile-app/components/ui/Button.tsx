import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { useTheme } from '../../lib/theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { height: 36, paddingHorizontal: 16 };
      case 'large':
        return { height: 56, paddingHorizontal: 24 };
      default:
        return { height: 48, paddingHorizontal: 20 };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return theme.typography.sizes.sm;
      case 'large':
        return theme.typography.sizes.lg;
      default:
        return theme.typography.sizes.md;
    }
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary;
      case 'danger':
        return theme.colors.error;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getBorderColor = (): string => {
    return variant === 'outline' ? theme.colors.primary : 'transparent';
  };

  const getTextColor = (): string => {
    return variant === 'outline' ? theme.colors.primary : '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getSizeStyles(),
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderColor: getBorderColor(), borderWidth: 1 },
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getTextSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
