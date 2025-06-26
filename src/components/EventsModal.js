import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Activity, Trash2, Zap } from 'lucide-react';
export const EventsModal = ({ isOpen, onClose, events, onClearEvents }) => {
    console.log('EventsModal render - isOpen:', isOpen, 'events count:', events.length);
    if (!isOpen)
        return null;
    const getEventIcon = (eventType) => {
        if (eventType.includes('course'))
            return '📚';
        if (eventType.includes('lesson'))
            return '✅';
        if (eventType.includes('post'))
            return '💬';
        if (eventType.includes('user') || eventType.includes('achievement'))
            return '🏆';
        if (eventType.includes('plugin'))
            return '🔌';
        if (eventType.includes('tab'))
            return '🔄';
        return '📡';
    };
    const getEventColor = (eventType) => {
        if (eventType.includes('created'))
            return {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-800',
                accent: 'bg-emerald-500'
            };
        if (eventType.includes('updated'))
            return {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-800',
                accent: 'bg-blue-500'
            };
        if (eventType.includes('deleted'))
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-800',
                accent: 'bg-red-500'
            };
        if (eventType.includes('completed'))
            return {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-800',
                accent: 'bg-purple-500'
            };
        if (eventType.includes('liked'))
            return {
                bg: 'bg-pink-50',
                border: 'border-pink-200',
                text: 'text-pink-800',
                accent: 'bg-pink-500'
            };
        if (eventType.includes('achievement'))
            return {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-800',
                accent: 'bg-amber-500'
            };
        return {
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-800',
            accent: 'bg-slate-500'
        };
    };
    const formatEventData = (data) => {
        const details = [];
        if (data.course?.title || data.courseTitle) {
            details.push({ label: 'Course', value: data.course?.title || data.courseTitle });
        }
        if (data.lessonTitle) {
            details.push({ label: 'Lesson', value: data.lessonTitle });
        }
        if (data.post?.content) {
            details.push({ label: 'Content', value: data.post.content.substring(0, 60) + '...' });
        }
        if (data.postTitle) {
            details.push({ label: 'Post', value: data.postTitle + '...' });
        }
        if (data.pluginName) {
            details.push({ label: 'Plugin', value: data.pluginName });
        }
        if (data.count !== undefined) {
            details.push({ label: 'Count', value: data.count.toString() });
        }
        if (data.badge) {
            details.push({ label: 'Badge', value: data.badge });
        }
        if (data.from && data.to) {
            details.push({ label: 'From', value: data.from || 'none' });
            details.push({ label: 'To', value: data.to });
        }
        return details;
    };
    const formatEventTitle = (eventType) => {
        return eventType
            .replace(/:/g, ' ')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-hidden", style: { backgroundColor: 'rgba(0, 0, 0, 0.6)' }, onClick: (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }, children: _jsx("div", { className: "flex items-center justify-center min-h-screen p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden", style: { backdropFilter: 'blur(10px)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Activity, { className: "w-6 h-6 text-emerald-600" }), _jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Live Events Stream" }), _jsx("p", { className: "text-sm text-slate-600", children: "Real-time plugin communication" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full", children: [_jsx("div", { className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }), _jsxs("span", { className: "text-sm font-medium text-emerald-700", children: [events.length, " events"] })] }), _jsx("button", { onClick: onClearEvents, className: "p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors", title: "Clear all events", children: _jsx(Trash2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: onClose, className: "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] })] }) }), _jsx("div", { className: "overflow-y-auto max-h-96 p-6", children: events.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-slate-400" }) }), _jsx("h3", { className: "text-lg font-medium text-slate-900 mb-2", children: "No Events Yet" }), _jsx("p", { className: "text-slate-600 mb-4", children: "Interact with the plugins to see live events appear here." }), _jsxs("div", { className: "text-sm text-slate-500 space-y-1", children: [_jsx("p", { children: "\u2022 Create or edit a course" }), _jsx("p", { children: "\u2022 Complete a lesson" }), _jsx("p", { children: "\u2022 Like a community post" }), _jsx("p", { children: "\u2022 Switch between plugin tabs" })] })] })) : (_jsx("div", { className: "space-y-3", children: events.map((event, index) => {
                                const colors = getEventColor(event.event);
                                const details = formatEventData(event.data);
                                const timeAgo = Math.floor((Date.now() - event.timestamp.getTime()) / 1000);
                                return (_jsx("div", { className: `${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-sm`, children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsxs("div", { className: "flex-shrink-0 relative", children: [_jsx("div", { className: `w-10 h-10 ${colors.accent} rounded-full flex items-center justify-center text-white shadow-sm`, children: _jsx("span", { className: "text-lg", children: getEventIcon(event.event) }) }), _jsx("div", { className: `absolute -bottom-1 -right-1 w-4 h-4 ${colors.accent} rounded-full flex items-center justify-center`, children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: `font-semibold ${colors.text}`, children: formatEventTitle(event.event) }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsx("span", { children: event.timestamp.toLocaleTimeString() }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [timeAgo, "s ago"] })] })] }), details.length > 0 && (_jsx("div", { className: "space-y-1", children: details.map((detail, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsxs("span", { className: `font-medium ${colors.text} opacity-80`, children: [detail.label, ":"] }), _jsx("span", { className: `${colors.text} opacity-90`, children: detail.value })] }, idx))) })), _jsx("div", { className: "mt-2 flex items-center justify-between", children: _jsxs("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/70 ${colors.text}`, children: [_jsx("div", { className: `w-1.5 h-1.5 ${colors.accent} rounded-full mr-1.5` }), event.pluginId || 'system'] }) })] })] }) }, index));
                            }) })) })] }) }) }));
};
