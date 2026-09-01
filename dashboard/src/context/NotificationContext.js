import React, { createContext, useContext, useState, useCallback } from "react";

export const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    addNotification: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {},
    clearAll: () => {},
});

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([
        {
            id: "initial-1",
            type: "system",
            title: "SCADA System Online",
            message: "IEEE 14 Bus Real-Time Security Platform initialized successfully.",
            timestamp: new Date().toLocaleTimeString(),
            read: false,
            severity: "info",
        },
    ]);

    const addNotification = useCallback((notif) => {
        setNotifications((prev) => {
            // Prevent duplicate spam within 3 seconds for same title
            const exists = prev.find(
                (n) => n.title === notif.title && (new Date() - new Date(n.rawTime || 0)) < 3000
            );
            if (exists) return prev;

            const newEntry = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                timestamp: new Date().toLocaleTimeString(),
                rawTime: new Date(),
                read: false,
                severity: notif.severity || "info",
                type: notif.type || "system",
                title: notif.title || "Grid Event",
                message: notif.message || "",
            };
            return [newEntry, ...prev.slice(0, 49)]; // keep latest 50
        });
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
