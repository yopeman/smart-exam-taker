import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
  TextInputProps 
} from 'react-native';
import { useTheme } from '../../lib/theme/theme';
import { Controller, Control } from 'react-hook-form';

interface InputProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  control?: Control<any>;
  name?: string;
  rules?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  control,
  name,
  rules,
  ...textInputProps
}) => {
  const { theme } = useTheme();

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <View style={[styles.container, containerStyle]}>
            {label && (
              <Text
                style={[
                  styles.label,
                  { color: theme.colors.text, fontSize: theme.typography.sizes.sm },
                  labelStyle,
                ]}
              >
                {label}
              </Text>
            )}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: (error || fieldError) ? theme.colors.error : theme.colors.border,
                  fontSize: theme.typography.sizes.md,
                },
                inputStyle,
              ]}
              placeholderTextColor={theme.colors.textLight}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              {...textInputProps}
            />
            {(error || fieldError?.message) && (
              <Text
                style={[
                  styles.error,
                  { color: theme.colors.error, fontSize: theme.typography.sizes.xs },
                ]}
              >
                {error || fieldError?.message}
              </Text>
            )}
          </View>
        )}
      />
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.colors.text, fontSize: theme.typography.sizes.sm },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: error ? theme.colors.error : theme.colors.border,
            fontSize: theme.typography.sizes.md,
          },
          inputStyle,
        ]}
        placeholderTextColor={theme.colors.textLight}
        {...textInputProps}
      />
      {error && (
        <Text
          style={[
            styles.error,
            { color: theme.colors.error, fontSize: theme.typography.sizes.xs },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    marginTop: 4,
  },
});
