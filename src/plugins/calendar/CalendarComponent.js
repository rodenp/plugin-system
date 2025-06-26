import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// Calendar Component - extracted from TabComponents.tsx CalendarTab
export const CalendarComponent = ({ currentUser, communityId, community, userRole, theme, ...props }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Use theme colors or defaults
    const themeColors = {
        primary: theme?.colors?.secondary || appliedTheme.colors.secondary,
        secondary: theme?.colors?.accent || appliedTheme.colors.accent,
        primaryLight: theme?.colors?.secondary ? `${theme.colors.secondary}20` : appliedTheme.colors.secondary + '20',
        text: theme?.colors?.textPrimary || appliedTheme.colors.textPrimary
    };
    // Local state for UI interactions
    const [currentDate, setCurrentDate] = React.useState(props.currentDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(props.selectedDate || null);
    const [view, setView] = React.useState(props.view || 'month');
    const [showCreateEvent, setShowCreateEvent] = React.useState(false);
    const events = props.events || [];
    const today = new Date();
    const displayDate = currentDate;
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    const getFirstDayOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return firstDay === 0 ? 7 : firstDay; // Convert Sunday (0) to 7
    };
    // Event handlers
    const handlePrevMonth = () => {
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        setCurrentDate(prevDate);
    };
    const handleNextMonth = () => {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        setCurrentDate(nextDate);
    };
    const handleToday = () => {
        setCurrentDate(new Date());
    };
    const handleDateSelect = async (date) => {
        const newSelectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), date);
        setSelectedDate(newSelectedDate);
        if (props.onDateSelect) {
            try {
                await props.onDateSelect(newSelectedDate);
            }
            catch (error) {
                console.error('Failed to select date:', error);
            }
        }
    };
    const handleCreateEvent = async () => {
        if (props.onCreateEvent) {
            try {
                await props.onCreateEvent({
                    title: 'New Event',
                    date: selectedDate || new Date(),
                    time: '6pm',
                    description: 'Event description'
                });
                setShowCreateEvent(false);
            }
            catch (error) {
                console.error('Failed to create event:', error);
            }
        }
        else {
            setShowCreateEvent(false);
        }
    };
    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(displayDate);
        const firstDay = getFirstDayOfMonth(displayDate);
        const days = [];
        // Previous month days
        const prevMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        for (let i = firstDay - 2; i >= 0; i--) {
            days.push({
                date: daysInPrevMonth - i,
                isCurrentMonth: false,
                hasEvent: false
            });
        }
        // Current month days
        for (let date = 1; date <= daysInMonth; date++) {
            const hasEvent = events.some(event => event.date === date);
            days.push({
                date,
                isCurrentMonth: true,
                hasEvent,
                event: events.find(event => event.date === date)
            });
        }
        // Next month days to fill the grid
        const totalCells = 35;
        const remainingCells = totalCells - days.length;
        for (let date = 1; date <= remainingCells; date++) {
            days.push({
                date,
                isCurrentMonth: false,
                hasEvent: false
            });
        }
        return days;
    };
    const calendarDays = renderCalendarGrid();
    return (React.createElement('div', {
        style: {
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            margin: 0
        }
    }, `${monthNames[displayDate.getMonth()]} ${displayDate.getFullYear()}`), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.muted,
            margin: 0
        }
    }, today.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }))), React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('button', {
        onClick: handlePrevMonth,
        style: {
            padding: appliedTheme.spacing.sm,
            color: appliedTheme.colors.muted,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: appliedTheme.font.sizeLg
        }
    }, '←'), React.createElement('button', {
        onClick: handleToday,
        style: {
            padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
            fontSize: appliedTheme.font.sizeSm,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: appliedTheme.borders.borderRadius,
            backgroundColor: appliedTheme.colors.surface,
            color: appliedTheme.colors.textPrimary,
            cursor: 'pointer'
        }
    }, 'Today'), React.createElement('button', {
        onClick: handleNextMonth,
        style: {
            padding: appliedTheme.spacing.sm,
            color: appliedTheme.colors.muted,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: appliedTheme.font.sizeLg
        }
    }, '→'))), 
    // Calendar Grid
    React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px'
        }
    }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => React.createElement('div', {
        key: day,
        style: {
            padding: appliedTheme.spacing.sm,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 500,
            color: appliedTheme.colors.muted,
            textAlign: 'center'
        }
    }, day)), calendarDays.map((day, index) => {
        const isSelected = selectedDate &&
            selectedDate.getDate() === day.date &&
            day.isCurrentMonth;
        return React.createElement('div', {
            key: index,
            style: {
                minHeight: '80px',
                padding: appliedTheme.spacing.sm,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                backgroundColor: appliedTheme.colors.surface
            }
        }, React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                cursor: day.isCurrentMonth ? 'pointer' : 'default',
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.xs,
                color: day.isCurrentMonth ? appliedTheme.colors.textPrimary : appliedTheme.colors.muted,
                fontWeight: isSelected ? 500 : 'normal',
                backgroundColor: isSelected ? themeColors.primaryLight : 'transparent'
            },
            onClick: day.isCurrentMonth ? () => handleDateSelect(day.date) : undefined
        }, day.date), day.hasEvent && React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeXs,
                marginTop: appliedTheme.spacing.xs,
                color: themeColors.primary,
                cursor: 'pointer'
            }
        }, `${day.event?.time} - ${day.event?.title}`));
    })), 
    // Action Buttons
    (userRole === 'owner' || userRole === 'admin') && React.createElement('div', {
        style: {
            marginTop: appliedTheme.spacing.lg,
            display: 'flex',
            justifyContent: 'flex-end'
        }
    }, React.createElement('button', {
        onClick: () => setShowCreateEvent(true),
        style: {
            color: 'white',
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 500,
            backgroundColor: themeColors.primary,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
        },
        onMouseEnter: (e) => e.target.style.opacity = '0.9',
        onMouseLeave: (e) => e.target.style.opacity = '1'
    }, '+ Create Event')), 
    // Selected Date Info
    selectedDate && React.createElement('div', {
        style: {
            marginTop: appliedTheme.spacing.lg,
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.surfaceAlt,
            borderRadius: appliedTheme.borders.borderRadius
        }
    }, React.createElement('h3', {
        style: {
            fontWeight: 500,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.sm
        }
    }, `Selected: ${selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, 'No events scheduled for this date.')), 
    // Error display
    props.error && React.createElement('div', {
        style: {
            margin: `${appliedTheme.spacing.lg} 0`,
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.danger + '10',
            border: `1px solid ${appliedTheme.colors.danger}`,
            borderRadius: appliedTheme.borders.borderRadius,
            color: appliedTheme.colors.danger,
            fontSize: appliedTheme.font.sizeSm
        }
    }, props.error)), 
    // Create Event Modal
    showCreateEvent && React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
        }
    }, React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            maxWidth: '24rem',
            width: '100%',
            margin: appliedTheme.spacing.md
        }
    }, React.createElement('div', {
        style: {
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: appliedTheme.spacing.md
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600
        }
    }, 'Create Event'), React.createElement('button', {
        onClick: () => setShowCreateEvent(false),
        style: {
            color: appliedTheme.colors.muted,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: appliedTheme.font.sizeLg
        }
    }, '×')), React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, 'Event creation functionality would be implemented here.'), React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('button', {
        onClick: () => setShowCreateEvent(false),
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            color: appliedTheme.colors.textSecondary,
            backgroundColor: appliedTheme.colors.surfaceAlt,
            borderRadius: appliedTheme.borders.borderRadius,
            border: 'none',
            cursor: 'pointer'
        }
    }, 'Cancel'), React.createElement('button', {
        onClick: handleCreateEvent,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            color: 'white',
            borderRadius: appliedTheme.borders.borderRadius,
            backgroundColor: themeColors.primary,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
        },
        onMouseEnter: (e) => e.target.style.opacity = '0.9',
        onMouseLeave: (e) => e.target.style.opacity = '1'
    }, 'Create')))))));
};
