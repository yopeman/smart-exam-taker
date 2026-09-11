import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  className,
}) => {
  const variantClass =
    variant === 'elevated'
      ? 'card--elevated'
      : variant === 'outlined'
      ? 'card--outlined'
      : '';
  return (
    <div className={['card', variantClass, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
};