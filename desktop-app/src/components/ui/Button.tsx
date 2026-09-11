import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const className = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled || loading ? 'button--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={onPress}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? <span className="button__spinner" aria-hidden="true" /> : title}
    </button>
  );
};