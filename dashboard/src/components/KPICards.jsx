import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import BoltIcon from "@mui/icons-material/Bolt";
import MemoryIcon from "@mui/icons-material/Memory";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

/* ── CodeFronts Theme-Adaptive Stat Card ───────────────────────── */
function StatCard({ title, value, subtitle, color, icon, barValue, delay = 0 }) {
    return (
        <Box
            sx={{
                p: 3, // 24px padding
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                height: "100%",
                minHeight: 172,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                animation: `blurToSharp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
                transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: color,
                    opacity: 0.85,
                },
                "&:hover": {
                    transform: "translateY(-3px)",
                    borderColor: BACKGROUND.borderHover,
                    boxShadow: "0 12px 28px -6px rgba(0, 0, 0, 0.18)",
                    "& .stat-icon-box": {
                        transform: "scale(1.08)",
                        bgcolor: color,
                        color: "#FFFFFF",
                    },
                },
            }}
        >
            {/* Top Label & Icon Ring */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Typography
                    className="text-eyebrow"
                    sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: TEXT.muted,
                    }}
                >
                    {title}
                </Typography>

                <Box
                    className="stat-icon-box"
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        color: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${BACKGROUND.border}`,
                        transition: "all 0.25s ease",
                    }}
                >
                    {icon}
                </Box>
            </Box>

            {/* Metric Value & Subtitle */}
            <Box my={0.5}>
                <Typography
                    sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.85rem",
                        fontWeight: 800,
                        color: TEXT.primary,
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                    }}
                >
                    {value}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: TEXT.muted, fontWeight: 500 }}>
                    {subtitle}
                </Typography>
            </Box>

            {/* Bottom Progress Line */}
            <Box
                sx={{
                    width: "100%",
                    height: 3.5,
                    borderRadius: `${RADIUS.pill}px`,
                    bgcolor: BACKGROUND.app,
                    overflow: "hidden",
                    mt: "auto",
                }}
            >
                <Box
                    sx={{
                        width: `${Math.min(Math.max(barValue ?? 100, 0), 100)}%`,
                        height: "100%",
                        borderRadius: `${RADIUS.pill}px`,
                        bgcolor: color,
                        transition: "width 0.4s ease",
                    }}
                />
            </Box>
        </Box>
    );
}

/* ── KPICards Component ────────────────────────────────────────────────── */
function KPICards({ prediction, confidence, totalSamples, attackCount }) {
    const isAttack = prediction === "ATTACK DETECTED";

    const cards = [
        {
            title: "SYSTEM STATUS",
            value: isAttack ? "ATTACK" : "NORMAL",
            subtitle: isAttack ? "FDIA Anomaly Active" : "SCADA Operational",
            color: isAttack ? STATUS.critical : STATUS.normal,
            icon: <SecurityIcon sx={{ fontSize: 18 }} />,
            barValue: 100,
            delay: 0,
        },
        {
            title: "MODEL CONFIDENCE",
            value: `${(confidence * 100).toFixed(1)}%`,
            subtitle: "XGBoost + RF Ensemble",
            color: ACCENT,
            icon: <BoltIcon sx={{ fontSize: 18 }} />,
            barValue: confidence * 100,
            delay: 80,
        },
        {
            title: "SAMPLES PROCESSED",
            value: totalSamples.toLocaleString(),
            subtitle: "Live Telemetry Stream",
            color: ACCENT,
            icon: <MemoryIcon sx={{ fontSize: 18 }} />,
            barValue: totalSamples > 0 ? 100 : 0,
            delay: 160,
        },
        {
            title: "ATTACKS DETECTED",
            value: attackCount.toLocaleString(),
            subtitle: "Injected Anomalies Logged",
            color: attackCount > 0 ? STATUS.warning : STATUS.normal,
            icon: <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />,
            barValue: Math.min((attackCount / Math.max(totalSamples, 1)) * 100, 100),
            delay: 240,
        },
    ];

    return (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {cards.map((c) => (
                <Grid key={c.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard {...c} />
                </Grid>
            ))}
        </Grid>
    );
}

export default KPICards;
