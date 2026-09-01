import React, { useState, useMemo, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Drawer, Toolbar, Typography, Box, List,
    ListItemButton, ListItemIcon, ListItemText,
    Divider, Tooltip, IconButton
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import TimelineIcon from "@mui/icons-material/Timeline";
import TableChartIcon from "@mui/icons-material/TableChart";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import MemoryIcon from "@mui/icons-material/Memory";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";

import { ColorModeContext } from "../context/ColorModeContext";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

const EXPANDED  = 230;
const COLLAPSED = 68;

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { mode, toggleColorMode } = useContext(ColorModeContext);
    const location = useLocation();
    const navigate = useNavigate();

    const isDark = mode === "dark";

    const menuItems = useMemo(() => [
        { text: "Dashboard",        icon: <DashboardIcon fontSize="small" />,        path: "/dashboard",     id: "dashboard",        section: true },
        { text: "Topology",         icon: <ElectricBoltIcon fontSize="small" />,     path: "/topology",      id: "topology",         section: true },
        { text: "Analytics",        icon: <TimelineIcon fontSize="small" />,         path: "/analytics",     id: "analytics",        section: true },
        { text: "Bus Monitor",      icon: <TableChartIcon fontSize="small" />,       path: "/monitor",       id: "bus-monitor",      section: true },
        { text: "Machine Learning", icon: <MemoryIcon fontSize="small" />,           path: "/ml",            id: "machine-learning", section: true },
        { text: "Security",         icon: <SecurityIcon fontSize="small" />,         path: "/security",      id: "security",         section: true },
        { text: "Notifications",    icon: <NotificationsNoneRoundedIcon fontSize="small" />, path: "/notifications", id: "notifications", section: false },
        { text: "Settings",         icon: <SettingsIcon fontSize="small" />,         path: "/settings",      id: "settings",         section: false },
    ], []);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleNav = (item) => {
        if (!item.section) {
            navigate(item.path);
            return;
        }

        if (location.pathname !== "/dashboard") {
            navigate(`/dashboard#${item.id}`);
            return;
        }

        window.history.replaceState(null, "", `#${item.id}`);
        scrollToSection(item.id);
    };

    const isItemActive = (item) => {
        if (!item.section) {
            return location.pathname === item.path;
        }

        if (location.pathname !== "/dashboard") {
            return false;
        }

        const hash = location.hash.replace("#", "");
        if (item.id === "dashboard") {
            return !hash || hash === "dashboard";
        }

        return hash === item.id;
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? COLLAPSED : EXPANDED,
                flexShrink: 0,
                transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
                "& .MuiDrawer-paper": {
                    width: collapsed ? COLLAPSED : EXPANDED,
                    transition: "width 0.25s cubic-bezier(.4,0,.2,1), background-color 0.2s ease, border-color 0.2s ease",
                    overflowX: "hidden",
                    backgroundColor: BACKGROUND.app,
                    borderRight: `1px solid ${BACKGROUND.border}`,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 10,
                },
            }}
        >
            {/* ── Brand Header ── */}
            <Toolbar
                disableGutters
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    px: collapsed ? 1 : 2,
                    minHeight: "64px !important",
                    borderBottom: `1px solid ${BACKGROUND.border}`,
                    transition: "border-color 0.2s ease",
                }}
            >
                {!collapsed && (
                    <Box display="flex" alignItems="center" gap={1.2}>
                        {/* Logo mark */}
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: `${RADIUS.sm}px`,
                                bgcolor: "var(--accent-muted)",
                                border: `1px solid ${ACCENT}`,
                                color: ACCENT,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.95rem",
                                flexShrink: 0,
                                transition: "all 0.2s ease",
                            }}
                        >
                            ⚡
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    lineHeight: 1.1,
                                    color: TEXT.primary,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                AEGIS
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "0.62rem",
                                    color: TEXT.muted,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Grid SCADA AI
                            </Typography>
                        </Box>
                    </Box>
                )}

                <IconButton
                    onClick={() => setCollapsed((c) => !c)}
                    size="small"
                    sx={{
                        color: TEXT.muted,
                        p: "5px",
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        border: `1px solid ${BACKGROUND.border}`,
                        transition: "all 0.15s ease",
                        "&:hover": {
                            color: ACCENT,
                            borderColor: ACCENT,
                            bgcolor: "var(--accent-muted)",
                        },
                    }}
                >
                    {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
                </IconButton>
            </Toolbar>

            {/* ── Navigation Items ── */}
            <List sx={{ mt: 1, px: 1, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const active = isItemActive(item);

                    return (
                        <Tooltip key={item.text} title={collapsed ? item.text : ""} placement="right">
                            <ListItemButton
                                onClick={() => handleNav(item)}
                                sx={{
                                    mb: 0.5,
                                    borderRadius: `${RADIUS.sm}px`,
                                    minHeight: 40,
                                    px: collapsed ? 1.5 : 1.5,
                                    justifyContent: collapsed ? "center" : "flex-start",
                                    bgcolor: active
                                        ? "var(--accent-muted)"
                                        : "transparent",
                                    border: "1px solid",
                                    borderColor: active ? "rgba(34, 211, 238, 0.25)" : "transparent",
                                    position: "relative",
                                    transition: "all 0.15s ease",
                                    "&:hover": {
                                        bgcolor: BACKGROUND.hover,
                                        "& .nav-icon, & .nav-label": { color: TEXT.primary },
                                    },
                                }}
                            >
                                {/* Left Accent Bar on Active Item */}
                                {active && !collapsed && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: 0,
                                            top: "20%",
                                            bottom: "20%",
                                            width: 3,
                                            borderRadius: "0 3px 3px 0",
                                            bgcolor: ACCENT,
                                        }}
                                    />
                                )}

                                <ListItemIcon
                                    className="nav-icon"
                                    sx={{
                                        color: active ? ACCENT : TEXT.muted,
                                        minWidth: collapsed ? 0 : 34,
                                        transition: "color 0.15s",
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>

                                {!collapsed && (
                                    <ListItemText
                                        primary={item.text}
                                        className="nav-label"
                                        primaryTypographyProps={{
                                            fontSize: "0.82rem",
                                            fontWeight: active ? 700 : 500,
                                            color: active ? TEXT.primary : TEXT.muted,
                                            letterSpacing: "-0.01em",
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </Tooltip>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: BACKGROUND.border }} />

            {/* ── Footer: CodeFronts Theme Toggle & System Status ── */}
            <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                {/* CodeFronts Sun/Moon Theme Toggle Switch */}
                {collapsed ? (
                    <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} placement="right">
                        <IconButton
                            onClick={toggleColorMode}
                            size="small"
                            sx={{
                                width: 36,
                                height: 36,
                                mx: "auto",
                                borderRadius: `${RADIUS.sm}px`,
                                bgcolor: BACKGROUND.hover,
                                border: `1px solid ${BACKGROUND.border}`,
                                color: isDark ? "#FBBF24" : "#0284C7",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    borderColor: ACCENT,
                                    bgcolor: "var(--accent-muted)",
                                },
                            }}
                        >
                            {isDark ? <LightModeRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Box
                        onClick={toggleColorMode}
                        className="cf-theme-toggle"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            {isDark ? (
                                <DarkModeRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />
                            ) : (
                                <LightModeRoundedIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
                            )}
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: TEXT.primary }}>
                                {isDark ? "Dark Mode" : "Light Mode"}
                            </Typography>
                        </Box>

                        {/* CodeFronts Switch Slider */}
                        <Box className={`cf-toggle-switch ${!isDark ? "active" : ""}`}>
                            <Box className="cf-toggle-knob">
                                {isDark ? "🌙" : "☀️"}
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* SCADA System Online Status Badge */}
                {collapsed ? (
                    <Tooltip title="SCADA Online" placement="right">
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                mx: "auto",
                                borderRadius: `${RADIUS.sm}px`,
                                bgcolor: STATUS.normalBg,
                                border: `1px solid ${STATUS.normalBorder}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                        </Box>
                    </Tooltip>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            px: 1.5,
                            py: 0.8,
                            borderRadius: `${RADIUS.sm}px`,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                        }}
                    >
                        <span className="pulse-dot" />
                        <Box>
                            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: STATUS.normal, lineHeight: 1.1 }}>
                                SYSTEM ONLINE
                            </Typography>
                            <Typography sx={{ fontSize: "0.62rem", color: TEXT.muted }}>
                                SCADA Connected
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}