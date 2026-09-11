import React from 'react';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  wide?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  style,
  wide,
}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${wide ? ' modal--wide' : ''}`}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="modal__header">
            <span className="modal__title">{title}</span>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>
        ) : null}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};