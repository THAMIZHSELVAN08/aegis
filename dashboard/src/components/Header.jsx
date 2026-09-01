import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Avatar,
    IconButton, Badge
} from "@mui/material";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import { useNotifications } from "../context/NotificationContext";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

/**
 * AEGIS SOC Header Component
 * CodeFronts SaaS App-Shell Header Pattern
 * Aligns live clock, grid integrity %, LIVE badge, notification bell, and avatar
 * into one compact right-aligned cluster with consistent spacing.
 */
function Header({ gridHealth = 100, totalBuses = 14, healthyBuses = 14 }) {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const healthColor =
        gridHealth > 80 ? STATUS.normal :
        gridHealth > 60 ? STATUS.warning : STATUS.critical;

    return (
        <Box
            sx={{
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                borderRadius: `${RADIUS.md}px`,
                boxShadow: "var(--card-shadow)",
                px: 3,
                py: 1.5,
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 64,
                transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
        >
            {/* ── Left: Platform Title ── */}
            <Box>
                <Typography className="text-eyebrow" sx={{ display: "block", mb: 0.2 }}>
                    IEEE 14-BUS REAL-TIME PLATFORM
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.05rem", sm: "1.2rem" },
                        lineHeight: 1.15,
                        color: TEXT.primary,
                        letterSpacing: "-0.01em",
                    }}
                >
                    Smart Grid SCADA Security Center
                </Typography>
            </Box>

            {/* ── Right: Compact Aligned Status Cluster ── */}
            <Box display="flex" alignItems="center" gap={1.5}>
                {/* Grid Health Pill */}
                <Box
                    sx={{
                        display: { xs: "none", sm: "flex" },
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.6,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        border: `1px solid ${BACKGROUND.border}`,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                >
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontSize: "0.65rem", color: TEXT.muted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.1 }}>
                            Grid Integrity
                        </Typography>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: healthColor, fontFamily: "var(--font-mono)", lineHeight: 1.15 }}>
                            {gridHealth}% ({healthyBuses}/{totalBuses})
                        </Typography>
                    </Box>
                </Box>

                {/* LIVE SCADA Badge */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.2,
                        py: 0.6,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: STATUS.normalBg,
                        border: `1px solid ${STATUS.normalBorder}`,
                        color: STATUS.normal,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        transition: "all 0.2s ease",
                    }}
                >
                    <WifiRoundedIcon sx={{ fontSize: 13 }} />
                    <span>LIVE</span>
                </Box>

                {/* Monospace Live Clock */}
                <Box
                    sx={{
                        display: { xs: "none", md: "block" },
                        px: 1.5,
                        py: 0.6,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        border: `1px solid ${BACKGROUND.border}`,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: TEXT.primary,
                        fontSize: "0.8rem",
                        letterSpacing: "0.02em",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                >
                    {currentTime.toLocaleTimeString()}
                </Box>

                {/* Notifications Bell */}
                <IconButton
                    onClick={() => navigate("/notifications")}
                    title="View Security Alerts"
                    size="small"
                    sx={{
                        bgcolor: BACKGROUND.app,
                        border: `1px solid ${BACKGROUND.border}`,
                        color: TEXT.muted,
                        borderRadius: `${RADIUS.sm}px`,
                        p: "7px",
                        transition: "all 0.15s ease",
                        "&:hover": {
                            color: ACCENT,
                            borderColor: ACCENT,
                            bgcolor: "var(--accent-muted)",
                        },
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        sx={{
                            "& .MuiBadge-badge": {
                                fontSize: "0.6rem",
                                minWidth: 14,
                                height: 14,
                                bgcolor: STATUS.critical,
                            },
                        }}
                    >
                        <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
                    </Badge>
                </IconButton>

                {/* User Operator Avatar */}
                <Avatar
                    sx={{
                        bgcolor: BACKGROUND.app,
                        color: TEXT.primary,
                        width: 32,
                        height: 32,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: `1px solid ${BACKGROUND.border}`,
                        borderRadius: `${RADIUS.sm}px`,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                >
                    SOC
                </Avatar>
            </Box>
        </Box>
    );
}

export default Header;