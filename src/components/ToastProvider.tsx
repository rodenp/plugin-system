import React, { createContext, useContext, useState, ReactNode } from 'react';
import ToastComponent, { Toast, ToastType } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    console.log('🍞 Toast shown:', newToast);
  };

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
      }}
    >
      {children}
      
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            {...toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};