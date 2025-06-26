import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
import ToastComponent from './Toast';
const ToastContext = createContext(undefined);
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const generateId = () => Math.random().toString(36).substr(2, 9);
    const showToast = (toast) => {
        const id = generateId();
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);
        console.log('🍞 Toast shown:', newToast);
    };
    const showSuccess = (title, message) => {
        showToast({ type: 'success', title, message });
    };
    const showError = (title, message) => {
        showToast({ type: 'error', title, message });
    };
    const showInfo = (title, message) => {
        showToast({ type: 'info', title, message });
    };
    const showWarning = (title, message) => {
        showToast({ type: 'warning', title, message });
    };
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: {
            showToast,
            showSuccess,
            showError,
            showInfo,
            showWarning,
            removeToast,
        }, children: [children, _jsx("div", { style: {
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                }, children: toasts.map(toast => (_jsx(ToastComponent, { ...toast, onRemove: removeToast }, toast.id))) })] }));
};
