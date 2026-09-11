import React from 'react';

interface InputProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  containerStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  multiline,
  autoCapitalize,
  containerStyle,
  inputStyle,
  maxLength,
}) => {
  return (
    <div className="input" style={containerStyle}>
      {label ? <label className="input__label">{label}</label> : null}
      {multiline ? (
        <textarea
          className={`input__field input__field--textarea${error ? ' input__field--error' : ''}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          maxLength={maxLength}
          rows={4}
        />
      ) : (
        <input
          className={`input__field${error ? ' input__field--error' : ''}`}
          value={value}
          type={secureTextEntry ? 'password' : 'text'}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoCapitalize={autoCapitalize}
          autoCorrect="off"
          style={inputStyle}
          maxLength={maxLength}
        />
      )}
      {error ? <span className="input__error">{error}</span> : null}
    </div>
  );
};