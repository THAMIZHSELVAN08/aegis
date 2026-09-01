import React, { useState } from "react";
import {
    Box, Typography, Button, Stack,
    Badge, Tabs, Tab, Grid
} from "@mui/material";

import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SecurityIcon from "@mui/icons-material/Security";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import MemoryIcon from "@mui/icons-material/Memory";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

import MainLayout from "../layouts/MainLayout";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import { useNotifications } from "../context/NotificationContext";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

/* ── Summary Stat Card ─────────────────────────────────────────────────── */
function NotifStatCard({ title, value, color, icon, subtitle }) {
    return (
        <Box
            sx={{
                p: 3, // 24px padding
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                minHeight: 140,
                position: "relative",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    borderColor: BACKGROUND.borderHover,
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography className="text-eyebrow" sx={{ fontSize: "0.68rem" }}>
                    {title}
                </Typography>
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${BACKGROUND.border}`,
                        transition: "all 0.2s ease",
                    }}
                >
                    {icon}
                </Box>
            </Box>

            <Box>
                <Typography
                    sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: TEXT.primary,
                        lineHeight: 1.1,
                        mb: 0.4,
                    }}
                >
                    {value}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: TEXT.muted }}>
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );
}

function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
    const [tabFilter, setTabFilter] = useState("all");

    const attackCount = notifications.filter((n) => n.severity === "error" || n.type === "attack").length;
    const warningCount = notifications.filter((n) => n.severity === "warning").length;
    const systemCount = notifications.filter((n) => n.type === "system" || n.severity === "info").length;
    const totalCount = notifications.length;

    const filteredNotifications = notifications.filter((n) => {
        if (tabFilter === "attacks") return n.severity === "error" || n.type === "attack";
        if (tabFilter === "warnings") return n.severity === "warning";
        if (tabFilter === "system") return n.type === "system" || n.severity === "info";
        return true;
    });

    const getSeverityConfig = (severity, type) => {
        if (severity === "error" || type === "attack") {
            return {
                color: STATUS.critical,
                bg: STATUS.criticalBg,
                border: STATUS.criticalBorder,
                icon: <WarningAmberRoundedIcon sx={{ color: STATUS.critical, fontSize: 20 }} />,
                chipLabel: "HIGH THREAT",
                chipClass: "soc-badge soc-badge-critical",
            };
        }
        if (severity === "warning") {
            return {
                color: STATUS.warning,
                bg: STATUS.warningBg,
                border: STATUS.warningBorder,
                icon: <SecurityIcon sx={{ color: STATUS.warning, fontSize: 20 }} />,
                chipLabel: "WARNING",
                chipClass: "soc-badge soc-badge-warning",
            };
        }
        return {
            color: ACCENT,
            bg: "var(--accent-muted)",
            border: "var(--border)",
            icon: <InfoRoundedIcon sx={{ color: ACCENT, fontSize: 20 }} />,
            chipLabel: "SYSTEM LOG",
            chipClass: "soc-badge soc-badge-accent",
        };
    };

    return (
        <MainLayout>
            <Box sx={{ width: "100%", flexGrow: 1 }}>
                {/* ── Standard Header ── */}
                <Header gridHealth={100} totalBuses={14} healthyBuses={14} />

                {/* ── Top Title Banner ── */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 3,
                        p: 3, // 24px
                        borderRadius: `${RADIUS.md}px`,
                        bgcolor: BACKGROUND.card,
                        border: `1px solid ${BACKGROUND.border}`,
                        boxShadow: "var(--card-shadow)",
                        width: "100%",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: `${RADIUS.sm}px`,
                                bgcolor: BACKGROUND.app,
                                border: `1px solid ${BACKGROUND.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: ACCENT,
                                transition: "all 0.2s ease",
                            }}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsActiveIcon sx={{ fontSize: 22 }} />
                            </Badge>
                        </Box>
                        <Box>
                            <Typography className="text-eyebrow" sx={{ display: "block", mb: 0.2 }}>
                                REAL-TIME SECURITY AUDIT
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: "1.2rem", sm: "1.35rem" },
                                    color: TEXT.primary,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                Notifications &amp; Alert Center
                            </Typography>
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DoneAllIcon fontSize="small" />}
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            sx={{ borderRadius: `${RADIUS.sm}px`, px: 2 }}
                        >
                            Mark All Read
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteSweepIcon fontSize="small" />}
                            onClick={clearAll}
                            disabled={notifications.length === 0}
                            sx={{ borderRadius: `${RADIUS.sm}px`, px: 2 }}
                        >
                            Clear Audit Log
                        </Button>
                    </Stack>
                </Box>

                {/* ── Stat Overview Grid ── */}
                <Grid container spacing={2.5} sx={{ mb: 3, width: "100%" }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <NotifStatCard
                            title="TOTAL ALERTS"
                            value={totalCount}
                            color={ACCENT}
                            icon={<NotificationsActiveIcon fontSize="small" />}
                            subtitle={`${unreadCount} unread entries`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <NotifStatCard
                            title="FDIA ATTACK THREATS"
                            value={attackCount}
                            color={STATUS.critical}
                            icon={<WarningAmberRoundedIcon fontSize="small" />}
                            subtitle="High priority anomalies"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <NotifStatCard
                            title="VOLTAGE WARNINGS"
                            value={warningCount}
                            color={STATUS.warning}
                            icon={<ShieldIcon fontSize="small" />}
                            subtitle="Bus voltage deviations"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <NotifStatCard
                            title="SYSTEM LOGS"
                            value={systemCount}
                            color={STATUS.normal}
                            icon={<MemoryIcon fontSize="small" />}
                            subtitle="SCADA status operations"
                        />
                    </Grid>
                </Grid>

                {/* ── Main Content 2-Column Grid ── */}
                <Grid container spacing={3} sx={{ width: "100%" }}>
                    {/* Left Column: Notification Stream */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        {/* Tabs Filter Toolbar */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                                px: 2,
                                py: 0.5,
                                borderRadius: `${RADIUS.md}px`,
                                bgcolor: BACKGROUND.card,
                                border: `1px solid ${BACKGROUND.border}`,
                                transition: "background-color 0.2s ease, border-color 0.2s ease",
                            }}
                        >
                            <Tabs
                                value={tabFilter}
                                onChange={(e, val) => setTabFilter(val)}
                                textColor="primary"
                                indicatorColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    "& .MuiTab-root": {
                                        minHeight: 42,
                                        fontWeight: 600,
                                        fontSize: "0.8rem",
                                        color: TEXT.muted,
                                        "&.Mui-selected": {
                                            color: ACCENT,
                                        },
                                    },
                                    "& .MuiTabs-indicator": {
                                        backgroundColor: ACCENT,
                                    },
                                }}
                            >
                                <Tab label={`All (${totalCount})`} value="all" />
                                <Tab label={`FDIA Threats (${attackCount})`} value="attacks" />
                                <Tab label={`Warnings (${warningCount})`} value="warnings" />
                                <Tab label={`System Logs (${systemCount})`} value="system" />
                            </Tabs>
                        </Box>

                        {/* Notification List (CodeFronts Left-Border Alert Pattern) */}
                        {filteredNotifications.length === 0 ? (
                            <Box
                                sx={{
                                    p: 6,
                                    textAlign: "center",
                                    borderRadius: `${RADIUS.md}px`,
                                    bgcolor: BACKGROUND.card,
                                    border: `1px solid ${BACKGROUND.border}`,
                                    transition: "background-color 0.2s ease, border-color 0.2s ease",
                                }}
                            >
                                <CheckCircleIcon sx={{ fontSize: 44, color: STATUS.normal, mb: 1.5, opacity: 0.8 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: TEXT.primary }}>
                                    No Notifications in this Filter
                                </Typography>
                                <Typography variant="body2" sx={{ color: TEXT.muted }}>
                                    All clear! No security alerts match your selected category.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1.5}>
                                {filteredNotifications.map((notif) => {
                                    const cfg = getSeverityConfig(notif.severity, notif.type);

                                    return (
                                        <Box
                                            key={notif.id}
                                            sx={{
                                                borderRadius: `${RADIUS.md}px`,
                                                bgcolor: BACKGROUND.card,
                                                border: `1px solid ${BACKGROUND.border}`,
                                                borderLeft: `3px solid ${cfg.color}`,
                                                p: 2.5, // 20px
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: 2,
                                                position: "relative",
                                                transition: "border-color 0.2s ease, background-color 0.2s ease",
                                                "&:hover": {
                                                    borderColor: BACKGROUND.borderHover,
                                                    bgcolor: BACKGROUND.hover,
                                                },
                                            }}
                                        >
                                            <Box display="flex" gap={2} alignItems="center" sx={{ flex: "1 1 400px" }}>
                                                {/* Icon container */}
                                                <Box
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: `${RADIUS.sm}px`,
                                                        bgcolor: BACKGROUND.app,
                                                        border: `1px solid ${BACKGROUND.border}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    {cfg.icon}
                                                </Box>

                                                {/* Text body */}
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Box display="flex" alignItems="center" gap={1.2} mb={0.4} flexWrap="wrap">
                                                        {/* Unread Accent Dot Indicator */}
                                                        {!notif.read && (
                                                            <Box
                                                                title="Unread Alert"
                                                                sx={{
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius: "50%",
                                                                    bgcolor: ACCENT,
                                                                    boxShadow: `0 0 6px ${ACCENT}`,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}

                                                        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT.primary }}>
                                                            {notif.title}
                                                        </Typography>

                                                        <span className={cfg.chipClass}>
                                                            {cfg.chipLabel}
                                                        </span>
                                                    </Box>
                                                    <Typography sx={{ fontSize: "0.82rem", color: TEXT.muted, lineHeight: 1.4 }}>
                                                        {notif.message}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={2} sx={{ flexShrink: 0 }}>
                                                <Typography sx={{ fontSize: "0.75rem", color: TEXT.muted, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                                                    {notif.timestamp}
                                                </Typography>

                                                {!notif.read && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => markAsRead(notif.id)}
                                                        sx={{
                                                            borderRadius: `${RADIUS.sm}px`,
                                                            fontSize: "0.72rem",
                                                            py: 0.4,
                                                            px: 1.2,
                                                        }}
                                                    >
                                                        Mark Read
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Grid>

                    {/* Right Column: Security Telemetry Audit Sidebar */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            {/* Card 1: Severity Breakdown */}
                            <DashboardCard title="📊 Threat Distribution" height="auto">
                                <Box sx={{ p: 0.5 }}>
                                    <Box mb={2}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: STATUS.critical }}>
                                                FDIA Attack Threats
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: STATUS.critical, fontFamily: "var(--font-mono)" }}>
                                                {attackCount} ({totalCount > 0 ? Math.round((attackCount / totalCount) * 100) : 0}%)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ height: 4, borderRadius: `${RADIUS.pill}px`, bgcolor: "rgba(125,125,125,0.12)", overflow: "hidden" }}>
                                            <Box sx={{ height: "100%", width: `${totalCount > 0 ? (attackCount / totalCount) * 100 : 0}%`, bgcolor: STATUS.critical }} />
                                        </Box>
                                    </Box>

                                    <Box mb={2}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: STATUS.warning }}>
                                                Voltage Warnings
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: STATUS.warning, fontFamily: "var(--font-mono)" }}>
                                                {warningCount} ({totalCount > 0 ? Math.round((warningCount / totalCount) * 100) : 0}%)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ height: 4, borderRadius: `${RADIUS.pill}px`, bgcolor: "rgba(125,125,125,0.12)", overflow: "hidden" }}>
                                            <Box sx={{ height: "100%", width: `${totalCount > 0 ? (warningCount / totalCount) * 100 : 0}%`, bgcolor: STATUS.warning }} />
                                        </Box>
                                    </Box>

                                    <Box mb={1}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: ACCENT }}>
                                                System Operations
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: ACCENT, fontFamily: "var(--font-mono)" }}>
                                                {systemCount} ({totalCount > 0 ? Math.round((systemCount / totalCount) * 100) : 0}%)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ height: 4, borderRadius: `${RADIUS.pill}px`, bgcolor: "rgba(125,125,125,0.12)", overflow: "hidden" }}>
                                            <Box sx={{ height: "100%", width: `${totalCount > 0 ? (systemCount / totalCount) * 100 : 0}%`, bgcolor: ACCENT }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </DashboardCard>

                            {/* Card 2: SCADA System Shield Checklist */}
                            <DashboardCard title="🛡️ Active SCADA Protections" height="auto">
                                <Stack spacing={1.5} sx={{ p: 0.5 }}>
                                    {[
                                        { title: "XGBoost Anomaly Shield", desc: "Live residual voltage vector inspection" },
                                        { title: "IEEE 14 Telemetry Monitor", desc: "100Hz bus state estimation" },
                                        { title: "Real-time Security Logging", desc: "Persistent audit trail storage" },
                                    ].map((item, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                p: 1.8,
                                                borderRadius: `${RADIUS.sm}px`,
                                                bgcolor: BACKGROUND.app,
                                                border: `1px solid ${BACKGROUND.border}`,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                transition: "background-color 0.2s ease, border-color 0.2s ease",
                                            }}
                                        >
                                            <VerifiedUserIcon sx={{ color: STATUS.normal, fontSize: 18 }} />
                                            <Box>
                                                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: TEXT.primary }}>
                                                    {item.title}
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                                    {item.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </DashboardCard>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
}

export default NotificationsPage;
