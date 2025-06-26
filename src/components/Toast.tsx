import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onRemove
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-remove after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = {
      transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isExiting ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      maxWidth: '24rem',
      position: 'relative' as const,
    };

    const typeStyles = {
      success: { borderLeftColor: '#10b981', borderLeftWidth: '4px' },
      error: { borderLeftColor: '#ef4444', borderLeftWidth: '4px' },
      info: { borderLeftColor: '#3b82f6', borderLeftWidth: '4px' },
      warning: { borderLeftColor: '#f59e0b', borderLeftWidth: '4px' },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} style={{ color: '#10b981' }} />;
      case 'error':
        return <AlertCircle {...iconProps} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertCircle {...iconProps} style={{ color: '#f59e0b' }} />;
      case 'info':
        return <Info {...iconProps} style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <div style={getToastStyles()}>
      {getIcon()}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {message}
          </div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: '#3b82f6',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          padding: '0.25rem',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastComponent;