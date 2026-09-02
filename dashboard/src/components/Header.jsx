import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import { BACKGROUND, ACCENT, TEXT, RADIUS } from "../theme/theme";

/* ── SVG Circular Progress Ring ──────────────────────────────────────────── */
function RingChart({ value = 93, size = 78, color = "#10B981" }) {
    const sw = 7;
    const r  = (size - sw * 2) / 2;
    const c  = 2 * Math.PI * r;
    const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color.replace(")", ", 0.14)").replace("rgb", "rgba")}
                strokeWidth={sw} opacity={0.25} />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.75s ease" }} />
        </svg>
    );
}

/* ── Header ──────────────────────────────────────────────────────────────── */
function Header({ gridHealth = 93, totalBuses = 14, healthyBuses = 13 }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const healthColor =
        gridHealth > 80 ? "#10B981" :
        gridHealth > 60 ? "#F59E0B" : "#EF4444";

    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

    return (
        <Box sx={{
            bgcolor: BACKGROUND.card,
            border: `1px solid ${BACKGROUND.border}`,
            borderRadius: `${RADIUS.md}px`,
            boxShadow: "var(--card-shadow)",
            px: { xs: 2.5, md: 3.5 },
            py: { xs: 2, md: 2.5 },
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: { xs: 2, md: 3 },
            minHeight: 112,
            overflow: "hidden",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}>

            {/* ── 1 · Logo + Title ───────────────────────────────────────── */}
            <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
                {/* Shield badge */}
                <Box sx={{
                    width: 58, height: 58,
                    borderRadius: `${RADIUS.md}px`,
                    background: "linear-gradient(145deg,#1C3D6B 0%,#0D1F3C 100%)",
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(34,211,238,0.22)",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(34,211,238,0.12)",
                }}>
                    <SecurityRoundedIcon sx={{ fontSize: 28, color: "#22D3EE" }} />
                </Box>

                {/* Text */}
                <Box>
                    <Typography sx={{
                        fontSize: "0.63rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: ACCENT, mb: 0.35,
                    }}>
                        IEEE 14-Bus Real-Time Platform
                    </Typography>

                    <Typography sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.15rem", sm: "1.45rem", md: "1.6rem" },
                        lineHeight: 1.12, color: TEXT.primary,
                        letterSpacing: "-0.02em",
                    }}>
                        Smart Grid SCADA<br />Security Center
                    </Typography>

                    <Typography sx={{
                        fontSize: "0.73rem", color: TEXT.muted, fontWeight: 400,
                        mt: 0.6, lineHeight: 1.45, maxWidth: 290,
                        display: { xs: "none", lg: "block" },
                    }}>
                        Real-time monitoring, attack detection, and grid integrity
                        management for a secure smart grid infrastructure.
                    </Typography>
                </Box>
            </Box>

            {/* ── 2 · Center illustration ────────────────────────────────── */}
            <Box
    sx={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        display: { xs: "none", xl: "flex" },
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        overflow: "hidden",
        position: "relative",
    }}
>
    <Box
        component="img"
        src="/grid_illustration.jpg"
        alt="Smart grid"
        sx={{
            width: "100%",
            height: "150px",
            objectFit: "cover",
            objectPosition: "center 35%",
            opacity: 0.82,
            display: "block",
        }}
    />
</Box>

            {/* spacer on non-xl where illustration is hidden */}
            <Box sx={{ flex: 1, display: { xs: "block", xl: "none" } }} />

            {/* ── 3 · Grid Integrity + LIVE + Clock ─────────────────────── */}
            <Box display="flex" alignItems="center" gap={2} flexShrink={0}
                sx={{ display: { xs: "none", md: "flex" } }}>

                {/* Ring */}
                <Box sx={{ position: "relative", width: 78, height: 78, flexShrink: 0 }}>
                    <RingChart value={gridHealth} size={78} color={healthColor} />
                    <Box sx={{ position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center" }}>
                        <SecurityRoundedIcon sx={{ fontSize: 20, color: healthColor }} />
                    </Box>
                </Box>

                {/* Stats column */}
                <Box>
                    <Typography sx={{
                        fontSize: "0.61rem", fontWeight: 700,
                        letterSpacing: "0.09em", textTransform: "uppercase",
                        color: TEXT.muted, mb: 0.15,
                    }}>
                        Grid Integrity
                    </Typography>
                    <Typography sx={{
                        fontSize: "2rem", fontWeight: 800,
                        color: healthColor, lineHeight: 1, letterSpacing: "-0.03em",
                    }}>
                        {gridHealth}%
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: healthColor, mb: 0.7 }}>
                        ({healthyBuses}/{totalBuses})
                    </Typography>

                    {/* LIVE */}
                    <Box sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.5,
                        px: 1, py: 0.3,
                        borderRadius: `${RADIUS.pill}px`,
                        bgcolor: "rgba(16,185,129,0.10)",
                        border: "1px solid rgba(16,185,129,0.28)",
                        color: "#10B981",
                        fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                        mb: 0.85,
                    }}>
                        <WifiRoundedIcon sx={{ fontSize: 10 }} />
                        LIVE
                    </Box>

                    {/* Clock */}
                    <Box display="flex" alignItems="center" gap={0.6}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 12, color: TEXT.muted }} />
                        <Box>
                            <Typography sx={{ fontSize: "0.79rem", fontWeight: 600, color: TEXT.primary, lineHeight: 1.15 }}>
                                {timeStr}
                            </Typography>
                            <Typography sx={{ fontSize: "0.65rem", color: TEXT.muted, fontWeight: 400 }}>
                                {dateStr}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>


        </Box>
    );
}

export default Header;