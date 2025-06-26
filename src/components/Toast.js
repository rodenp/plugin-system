import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
const ToastComponent = ({ id, type, title, message, duration = 5000, action, onRemove }) => {
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
            position: 'relative',
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
                return _jsx(CheckCircle, { ...iconProps, style: { color: '#10b981' } });
            case 'error':
                return _jsx(AlertCircle, { ...iconProps, style: { color: '#ef4444' } });
            case 'warning':
                return _jsx(AlertCircle, { ...iconProps, style: { color: '#f59e0b' } });
            case 'info':
                return _jsx(Info, { ...iconProps, style: { color: '#3b82f6' } });
        }
    };
    return (_jsxs("div", { style: getToastStyles(), children: [getIcon(), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }, children: title }), message && (_jsx("div", { style: { fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }, children: message })), action && (_jsx("button", { onClick: action.onClick, style: {
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#3b82f6',
                            fontWeight: '600',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                        }, children: action.label }))] }), _jsx("button", { onClick: handleRemove, style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '0.25rem',
                }, children: _jsx(X, { size: 16 }) })] }));
};
export default ToastComponent;
