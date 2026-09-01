import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ColorModeContext } from "./context/ColorModeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { buildTheme } from "./theme/theme";
import Dashboard from "./pages/Dashboard";
import NotificationsPage from "./pages/NotificationsPage";
import PlaceholderPage from "./pages/PlaceholderPage";

function App() {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem("aegis_theme");
        return saved === "light" ? "light" : "dark";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", mode);
        localStorage.setItem("aegis_theme", mode);
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prev) => {
                    const next = prev === "dark" ? "light" : "dark";
                    document.documentElement.setAttribute("data-theme", next);
                    localStorage.setItem("aegis_theme", next);
                    return next;
                });
            },
            setColorMode: (newMode) => {
                document.documentElement.setAttribute("data-theme", newMode);
                localStorage.setItem("aegis_theme", newMode);
                setMode(newMode);
            },
        }),
        [mode]
    );

    const theme = useMemo(() => buildTheme(mode), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <NotificationProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard"     element={<Dashboard />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/topology"      element={<Navigate to="/dashboard#topology" replace />} />
                            <Route path="/analytics"     element={<Navigate to="/dashboard#analytics" replace />} />
                            <Route path="/monitor"       element={<Navigate to="/dashboard#bus-monitor" replace />} />
                            <Route path="/ml"            element={<Navigate to="/dashboard#machine-learning" replace />} />
                            <Route path="/security"      element={<Navigate to="/dashboard#security" replace />} />
                            <Route path="/settings"      element={<PlaceholderPage title="Settings" />} />
                        </Routes>
                    </BrowserRouter>
                </ThemeProvider>
            </NotificationProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
