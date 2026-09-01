import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import BoltIcon from "@mui/icons-material/Bolt";
import MemoryIcon from "@mui/icons-material/Memory";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

/* ── CodeFronts KPI Stat Card ───────────────────────────────────────────── */
function StatCard({ title, value, subtitle, color, icon, barValue }) {
    return (
        <Box
            sx={{
                p: 3, // 24px padding
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                height: "100%",
                minHeight: 168,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    borderColor: BACKGROUND.borderHover,
                },
                position: "relative",
            }}
        >
            {/* Top Label & Icon */}
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

            {/* Metric Value */}
            <Box my={1}>
                <Typography
                    sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: TEXT.primary,
                        lineHeight: 1.1,
                        mb: 0.5,
                    }}
                >
                    {value}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: TEXT.muted }}>
                    {subtitle}
                </Typography>
            </Box>

            {/* Bottom Status Progress Line */}
            <Box
                sx={{
                    width: "100%",
                    height: 3,
                    borderRadius: `${RADIUS.pill}px`,
                    bgcolor: "rgba(125, 125, 125, 0.12)",
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
                        transition: "width 0.3s ease",
                    }}
                />
            </Box>
        </Box>
    );
}

/* ── KPICards ─────────────────────────────────────────────────────────────── */
function KPICards({ prediction, confidence, totalSamples, attackCount }) {
    const isAttack = prediction === "ATTACK DETECTED";

    const cards = [
        {
            title: "SYSTEM STATUS",
            value: isAttack ? "ATTACK" : "NORMAL",
            subtitle: isAttack ? "FDIA Anomaly Active" : "SCADA Operational",
            color: isAttack ? STATUS.critical : STATUS.normal,
            icon: <SecurityIcon sx={{ fontSize: 17 }} />,
            barValue: 100,
        },
        {
            title: "MODEL CONFIDENCE",
            value: `${(confidence * 100).toFixed(1)}%`,
            subtitle: "XGBoost + RF Ensemble",
            color: ACCENT,
            icon: <BoltIcon sx={{ fontSize: 17 }} />,
            barValue: confidence * 100,
        },
        {
            title: "SAMPLES PROCESSED",
            value: totalSamples.toLocaleString(),
            subtitle: "Live Telemetry Stream",
            color: ACCENT,
            icon: <MemoryIcon sx={{ fontSize: 17 }} />,
            barValue: totalSamples > 0 ? 100 : 0,
        },
        {
            title: "ATTACKS DETECTED",
            value: attackCount.toLocaleString(),
            subtitle: "Injected Anomalies Logged",
            color: attackCount > 0 ? STATUS.warning : STATUS.normal,
            icon: <WarningAmberRoundedIcon sx={{ fontSize: 17 }} />,
            barValue: Math.min((attackCount / Math.max(totalSamples, 1)) * 100, 100),
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
