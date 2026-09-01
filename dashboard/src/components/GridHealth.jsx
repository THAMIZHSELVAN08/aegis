import React from "react";
import { Box, Typography } from "@mui/material";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { calculateGridHealth } from "../utils/gridHealth";
import { BACKGROUND, STATUS, TEXT, RADIUS } from "../theme/theme";

function GridHealth({ reading }) {
    if (!reading) {
        return (
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", color: TEXT.muted }}>
                    Waiting for telemetry stream…
                </Typography>
            </Box>
        );
    }

    const { healthPct, healthyBuses, totalBuses, buses } = calculateGridHealth(reading);

    const color =
        healthPct > 80 ? STATUS.normal :
        healthPct > 60 ? STATUS.warning : STATUS.critical;

    const label =
        healthPct > 80 ? "OPTIMAL" :
        healthPct > 60 ? "WARNING" : "CRITICAL";

    return (
        <Box sx={{ p: 3 }}>
            {/* Percentage & Status Label */}
            <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: BACKGROUND.app,
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${BACKGROUND.border}`,
                        flexShrink: 0,
                    }}
                >
                    <ElectricBoltIcon sx={{ fontSize: 24 }} />
                </Box>

                <Box>
                    <Typography
                        sx={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "2rem",
                            fontWeight: 700,
                            lineHeight: 1,
                            color: TEXT.primary,
                            mb: 0.4,
                        }}
                    >
                        {healthPct}%
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: TEXT.muted,
                        }}
                    >
                        <span style={{ color }}>{label}</span> — {healthyBuses}/{totalBuses} buses nominal
                    </Typography>
                </Box>
            </Box>

            {/* Progress bar */}
            <Box
                sx={{
                    width: "100%",
                    height: 4,
                    borderRadius: `${RADIUS.pill}px`,
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        height: "100%",
                        width: `${healthPct}%`,
                        bgcolor: color,
                        transition: "width 0.3s ease",
                    }}
                />
            </Box>

            {/* Bus list */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: 1.2,
                }}
            >
                {buses.map((b) => {
                    const busColor = b.healthy ? STATUS.normal : STATUS.critical;

                    return (
                        <Box
                            key={b.busId}
                            sx={{
                                px: 1.5,
                                py: 1,
                                borderRadius: `${RADIUS.sm}px`,
                                bgcolor: BACKGROUND.app,
                                border: `1px solid ${BACKGROUND.border}`,
                                textAlign: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: "0.65rem", color: TEXT.muted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                BUS {b.busId}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: busColor,
                                    fontFamily: "var(--font-mono)",
                                    mt: 0.2,
                                }}
                            >
                                {isNaN(b.voltage) ? "—" : b.voltage.toFixed(3)}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

export default GridHealth;